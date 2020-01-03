import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {combineLatest, Observable, of} from 'rxjs';
import {Artist, Profile} from '../../utils/firestore-types';
import {AngularFireStorage} from '@angular/fire/storage';
import {map, switchMap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
  selector: 'app-artists',
  templateUrl: './artists.component.html',
  styleUrls: ['./artists.component.scss']
})
export class ArtistsComponent implements OnInit {
  public useBookmarks$: Observable<boolean>;
  private artistsColl: AngularFirestoreCollection<Artist>;
  public artists$: Observable<[Artist & { id: string; }, Observable<string>, Promise<Promise<string>[]>][]>;
  public signedIn$: Observable<boolean>;

  constructor(private route: ActivatedRoute, private afAuth: AngularFireAuth,
              private afs: AngularFirestore, private storage: AngularFireStorage) {
    this.artistsColl = this.afs.collection('artists');
    this.useBookmarks$ = this.route.data.pipe(map(data => data.bookmarks));
    const bookmarks$ = this.afAuth.user.pipe(
      switchMap(user => (user != null ?
        this.afs.doc(`profiles/${user.uid}`).valueChanges() :
        of(null)) as Observable<Profile | undefined | null>
      ),
      map(profile => profile?.bookmarks)
    );
    this.signedIn$ = combineLatest(this.useBookmarks$, this.afAuth.user).pipe(map(
      ([useBookmarks, user]) =>
        !useBookmarks || user != null)
    );
    this.artists$ = combineLatest(this.useBookmarks$, bookmarks$, this.artistsColl.valueChanges({idField: 'id'})).pipe(
      map(([useBookmarks, bookmarks, values]) =>
        values.filter(value => !useBookmarks || (bookmarks || []).includes(value.id))
          .map(value => [
            value,
            this.storage.ref(`artists/${value.id}/avatar`).getDownloadURL(),
            this.storage.storage.ref(`artists/${value.id}/examples`).listAll()
              .then(example => example.items.map(e => e.getDownloadURL()))
          ])
      )
    );
  }

  ngOnInit() {
  }
}
