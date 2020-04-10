import {Component, OnInit} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {Artist, Conversation, Profile} from '../../utils/firestore-types';
import {AngularFirestore} from '@angular/fire/firestore';
import {map, switchMap} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {compareTimestamps} from '../../utils/firebase-utils';

@Component({
  selector: 'app-conversations',
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss']
})
export class ConversationsComponent implements OnInit {
  public conversations$: Observable<[Observable<Profile | Artist>, Observable<string>, string, boolean][]>;

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore, private storage: AngularFireStorage) {
    this.conversations$ = afAuth.user.pipe(
      switchMap(user => combineLatest([
        afs.collection<Conversation>('conversations', ref => ref.where('profile', '==', user.uid)).valueChanges({idField: 'id'}),
        afs.collection<Conversation>('conversations', ref => ref.where('artist', '==', user.uid)).valueChanges({idField: 'id'})
      ])),
      map(([artists, profiles]) =>
        (profiles.map(profile => [profile, afs.doc<Profile>(`profiles/${profile.profile}`).valueChanges(),
          storage.ref(`profiles/${profile.profile}/avatar`).getDownloadURL(), profile.id, false]) as
          [Conversation, Observable<Profile | Artist>, Observable<string>, string, boolean][])
          .concat(
            artists.map(artist => [artist, afs.doc<Artist>(`artists/${artist.artist}`).valueChanges(),
              storage.ref(`artists/${artist.artist}/avatar`).getDownloadURL(), artist.id, true]))
          .sort((a, b) => compareTimestamps(a[0].lastTimestamp, b[0].lastTimestamp, true))
          .map(conversation => conversation.slice(1)) as [Observable<Profile | Artist>, Observable<string>, string, boolean][]
      )
    );
  }

  ngOnInit() {
  }
}
