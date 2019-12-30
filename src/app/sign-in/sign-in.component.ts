import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Profile} from '../../utils/firestore-types';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {uploadTaskToPromise} from '../../utils/firebase-storage-utils';
import {AngularFireStorage} from '@angular/fire/storage';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  constructor(private router: Router, private afAuth: AngularFireAuth, private afs: AngularFirestore, private storage: AngularFireStorage) {
  }

  ngOnInit() {
  }

  async onSuccess() {
    const user = this.afAuth.auth.currentUser;
    await this.afs.firestore.runTransaction(async transaction => {
      const docRef = this.afs.firestore.collection('profiles').doc(user.uid);
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        const profile: Profile = {
          name: user.displayName,
          email: user.email,
          isArtist: false
        };
        transaction.set(docRef, profile);
        await uploadTaskToPromise(this.storage.upload(`profiles/${user.uid}/avatar`, await (await fetch(user.photoURL)).blob()).task);
      } else {
        transaction.update(docRef, {});
      }
    });
    await this.router.navigate(['/']);
  }
}
