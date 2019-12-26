import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {combineLatest, Observable, of} from 'rxjs';
import {Artist, Profile} from '../../utils/firestore-types';
import {AngularFireStorage} from '@angular/fire/storage';
import {map, switchMap} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {SubscribingComponent} from '../../utils/other-utils';
import {AngularFireAuth} from '@angular/fire/auth';

@Component({
  selector: 'app-artists',
  templateUrl: './artists.component.html',
  styleUrls: ['./artists.component.scss']
})
export class ArtistsComponent extends SubscribingComponent implements OnInit {
  private artistsColl: AngularFirestoreCollection<Artist>;
  public artists$: Observable<[Artist & { id: string; }, Observable<string>, Promise<Promise<string>[]>][]>;

  constructor(private route: ActivatedRoute, private afAuth: AngularFireAuth,
              private afs: AngularFirestore, private storage: AngularFireStorage) {
    super();
    this.artistsColl = this.afs.collection('artists');
    const useBookmarks$ = route.data.pipe(map(data => data.bookmarks));
    const bookmarks$ = afAuth.user.pipe(
      switchMap(user => (user != null ?
        afs.doc(`profiles/${user.uid}`).valueChanges() :
        of(null)) as Observable<Profile | undefined | null>
      ),
      map(profile => profile?.bookmarks)
    );
    this.artists$ = combineLatest(useBookmarks$, bookmarks$, this.artistsColl.valueChanges({idField: 'id'})).pipe(
      map(([useBookmarks, bookmarks, values]) =>
        values.filter(value => !useBookmarks || (bookmarks.includes(value.id)))
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
