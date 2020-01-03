import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Artist, Profile} from '../../utils/firestore-types';
import {Observable, of, Subject} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {setTitle, SubscribingComponent, swalLoading} from '../../utils/other-utils';
import {Title} from '@angular/platform-browser';
import {AngularFireAuth} from '@angular/fire/auth';
import Swal from 'sweetalert2';
import {AngularFireFunctions} from '@angular/fire/functions';
import {getIsAdmin} from '../../utils/profile-utils';

@Component({
  selector: 'app-artist',
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.scss']
})
export class ArtistComponent extends SubscribingComponent implements OnInit {
  public id: string;
  private artistDoc: AngularFirestoreDocument<Artist>;
  public artist$: Observable<[Artist, Observable<boolean>]>;
  public avatar$: Observable<string>;
  public examples: Promise<Promise<string>[]>;
  private newArtist$ = new Subject();
  public isAdmin$: Observable<boolean>;
  public isThis$: Observable<boolean>;

  constructor(private titleService: Title, private router: Router, private route: ActivatedRoute,
              private afAuth: AngularFireAuth, private afs: AngularFirestore,
              private storage: AngularFireStorage, private fns: AngularFireFunctions) {
    super();
    this.isAdmin$ = getIsAdmin(afAuth, afs);
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
      this.id = params.get('id');
      this.artistDoc = this.afs.doc(`artists/${this.id}`);
      this.artist$ = this.artistDoc.valueChanges().pipe(map(artist =>
        artist != null ? [artist, this.afAuth.user.pipe(
          switchMap(user => (user != null ?
            this.afs.doc(`profiles/${user.uid}`).valueChanges() :
            of(null)) as Observable<Profile | undefined | null>),
          map(profile => (profile?.bookmarks || []).includes(this.id))
        )] : undefined
      ));
      this.avatar$ = this.storage.ref(`artists/${this.id}/avatar`).getDownloadURL();
      this.examples = this.storage.storage.ref(`artists/${this.id}/examples`).listAll()
        .then(example => example.items.map(e => e.getDownloadURL()));
      this.isThis$ = this.afAuth.user.pipe(map(user => user.uid === this.id));
      this.newArtist$.next();
      this.artist$.pipe(takeUntil(this.newArtist$)).subscribe(artist => {
        setTitle(this.titleService, [artist?.[0]?.name || 'Not found', 'Artists']);
      });
    });
    this.unsubscribe.subscribe(() => this.newArtist$.complete());
  }

  async toggleBookmark() {
    const user = this.afAuth.auth.currentUser;
    if (user != null) {
      await this.afs.firestore.runTransaction(async transaction => {
        const profileDoc = this.afs.firestore.doc(`profiles/${user.uid}`);
        let bookmarks: string[] = (await transaction.get(profileDoc)).get('bookmarks') || [];
        if (!bookmarks.includes(this.id)) {
          bookmarks.push(this.id);
        } else {
          bookmarks = bookmarks.filter(e => e !== this.id);
        }
        await transaction.update(profileDoc, 'bookmarks', bookmarks);
      });
    } else {
      if ((await Swal.fire({
        title: 'Sign in required',
        text: 'You need to sign in to bookmark this artist.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sign in'
      })).value) {
        await this.router.navigate(['/signin']);
      }
    }
  }

  async report() {
    const user = this.afAuth.auth.currentUser;
    if (user != null) {
      const message = await Swal.fire({
        title: 'Report artist',
        html: `Please enter the reason you're reporting the artist <b>${(await this.artistDoc.ref.get()).get('name')}</b>:`,
        icon: 'warning',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Report',
        inputValidator: value => !value && 'Please enter the reason!'
      });
      if (!message.value) {
        return;
      }
      swalLoading('Reporting artist...', 'Please wait while the artist is being reported...');
      await this.fns.functions.httpsCallable('reportArtist')({reportee: this.id, message: message.value});
      await Swal.fire('Artist reported', 'Artist reported successfully.', 'success');
    } else {
      if ((await Swal.fire({
        title: 'Sign in required',
        text: 'You need to sign in to report this artist.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sign in'
      })).value) {
        await this.router.navigate(['/signin']);
      }
    }
  }

  async delete() {
    try {
      if (!(await Swal.fire({
        title: 'Delete artist',
        html: `Are you sure you want to delete the artist <b>${(await this.artistDoc.ref.get()).get('name')}</b>? This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete'
      })).value) {
        return;
      }
      swalLoading('Deleting artist...', 'Please wait while the artist is being deleted...');
      await this.router.navigate(['/artists']);
      await this.fns.functions.httpsCallable('deleteArtistProfile')(this.id);
      await Swal.fire('Artist deleted', 'Artist deleted successfully.', 'success');
    } catch (e) {
      await Swal.fire('Error deleting artist', e.toString(), 'error');
    }
  }
}
