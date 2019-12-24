import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {ComponentWithProfile, performSensitiveAction} from '../../utils/profile-utils';
import {AngularFireFunctions} from '@angular/fire/functions';
import {uploadTaskToPromise} from '../../utils/firebase-storage-utils';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent extends ComponentWithProfile implements OnInit {
  constructor(private router: Router, afAuth: AngularFireAuth, afs: AngularFirestore,
              private storage: AngularFireStorage, private fns: AngularFireFunctions) {
    super(afAuth, afs);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  async becomeArtist() {
    const user = this.afAuth.auth.currentUser;
    await performSensitiveAction(user, {
      title: 'Become an artist',
      action: 'become an artist',
      titlePresent: 'Becoming an artist',
      actionPresent: 'you\'re becoming an artist',
      titleDone: 'Now an artist',
      actionDone: 'You are now an artist'
    }, async () => {
      // Once you create your billing profile, replace this function with the following:
      // callAndNavigate(this.fns.functions, this.router, 'becomeArtist', ['/profile-artist'])
      await this.fns.functions.httpsCallable('becomeArtist')();
      await uploadTaskToPromise(this.storage.storage.ref(`artists/${user.uid}/avatar`).put(await (await fetch(user.photoURL)).blob()));
      await this.router.navigate(['/profile-artist']);
    });
  }

  async deleteProfile() {
    const user = this.afAuth.auth.currentUser;
    await performSensitiveAction(user, {
      title: 'Delete profile',
      action: 'delete your profile',
      titlePresent: 'Deleting profile',
      actionPresent: 'your profile is being deleted',
      titleDone: 'Profile deleted',
      actionDone: 'Your profile was deleted successfully'
    }, async () => {
      await this.fns.functions.httpsCallable('deleteProfile')();
      await this.router.navigate(['/']);
      await this.afAuth.auth.signOut();
    });
  }
}
