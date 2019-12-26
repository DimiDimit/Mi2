import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Artist, Profile} from '../../utils/firestore-types';
import {Observable, of, Subject} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {setTitle, SubscribingComponent} from '../../utils/other-utils';
import {Title} from '@angular/platform-browser';
import {AngularFireAuth} from '@angular/fire/auth';
import Swal from 'sweetalert2';

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

  constructor(private titleService: Title, private router: Router, private route: ActivatedRoute,
              private afAuth: AngularFireAuth, private afs: AngularFirestore, private storage: AngularFireStorage) {
    super();
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
      this.id = params.get('id');
      this.artistDoc = this.afs.doc(`artists/${this.id}`);
      this.artist$ = this.artistDoc.valueChanges().pipe(map(artist =>
        [artist, this.afAuth.user.pipe(
          switchMap(user => (user != null ?
            this.afs.doc(`profiles/${user.uid}`).valueChanges() :
            of(null)) as Observable<Profile | undefined | null>),
          map(profile => (profile?.bookmarks || []).includes(this.id))
        )]
      ));
      this.avatar$ = this.storage.ref(`artists/${this.id}/avatar`).getDownloadURL();
      this.examples = this.storage.storage.ref(`artists/${this.id}/examples`).listAll()
        .then(example => example.items.map(e => e.getDownloadURL()));
      this.newArtist$.next();
      this.artist$.pipe(takeUntil(this.newArtist$)).subscribe(artist => {
        setTitle(this.titleService, [artist[0].name, 'Artists']);
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
}
