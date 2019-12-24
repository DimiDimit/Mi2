import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Profile} from '../../utils/firestore-types';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';

const defaultProfile: Profile = {
  isArtist: false
};

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  constructor(private router: Router, private afAuth: AngularFireAuth, private afs: AngularFirestore) {
  }

  ngOnInit() {
  }

  async onSuccess() {
    await this.afs.firestore.runTransaction(async transaction => {
      const docRef = this.afs.firestore.collection('profiles').doc(this.afAuth.auth.currentUser.uid);
      const doc = await transaction.get(docRef);
      if (!doc.exists) {
        transaction.set(docRef, defaultProfile);
      } else {
        transaction.update(docRef, {});
      }
    });
    await this.router.navigate(['/']);
  }
}
