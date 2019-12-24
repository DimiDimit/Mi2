import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {callAndNavigate, ComponentWithArtist, performSensitiveAction} from '../../utils/profile-utils';
import {AngularFireFunctions} from '@angular/fire/functions';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {first, take, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {uploadTaskToPromise} from '../../utils/firebase-storage-utils';
import {swalLoading} from '../../utils/other-utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile-artist',
  templateUrl: './profile-artist.component.html',
  styleUrls: ['./profile-artist.component.scss']
})
export class ProfileArtistComponent extends ComponentWithArtist implements OnInit {
  @ViewChild('avatar', {static: false}) avatar: ElementRef;

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('')
  });
  avatarPreview$ = new Subject<string>();

  constructor(private router: Router, afAuth: AngularFireAuth, afs: AngularFirestore,
              private storage: AngularFireStorage, private fns: AngularFireFunctions) {
    super(afAuth, afs);
  }

  ngOnInit() {
    super.ngOnInit();
    this.newProfile$.pipe(take(1)).subscribe(() => {
      this.artist$.pipe(take(1), takeUntil(this.unsubscribe)).subscribe(artist => {
        this.form.setValue({
          name: artist.name,
          description: artist.description
        });
      });
    });
    this.afAuth.user.pipe(first(value => value != null), takeUntil(this.unsubscribe)).subscribe(async user => {
      this.avatarPreview$.next(await this.storage.storage.ref(`artists/${user.uid}/avatar`).getDownloadURL());
    });
  }

  updateAvatarPreview() {
    const reader = new FileReader();
    reader.readAsDataURL(this.avatar.nativeElement.files[0]);
    reader.addEventListener('load', () => {
      this.avatarPreview$.next(reader.result as string);
    });
  }

  async onSubmit() {
    try {
      swalLoading('Saving artist profile...',
        'Please wait while the changes to your artist profile are being saved...');
      const user = await this.afAuth.auth.currentUser;
      await this.afs.doc(`artists/${user.uid}`).update(this.form.value);
      if (this.avatar.nativeElement.files.length > 0) {
        await uploadTaskToPromise(this.storage.storage.ref(`artists/${user.uid}/avatar`).put(this.avatar.nativeElement.files[0]));
      }
      await Swal.fire('Artist profile saved',
        'The changes to your artist profile were saved successfully.', 'success');
    } catch (e) {
      await Swal.fire('Error saving artist profile', e.toString(), 'error');
    }
  }

  async deleteArtistProfile() {
    const user = this.afAuth.auth.currentUser;
    await performSensitiveAction(user, {
      title: 'Delete artist profile',
      action: 'delete your artist profile',
      confirmExtra: 'This will <b>not</b> delete your normal profile.',
      titlePresent: 'Deleting artist profile',
      actionPresent: 'your artist profile is being deleted',
      titleDone: 'Artist profile deleted',
      actionDone: 'Your artist profile was deleted successfully'
    }, callAndNavigate(this.fns.functions, this.router, 'deleteArtistProfile', ['/']), async () => {
      const userDocRef = this.afs.firestore.collection('artists').doc(user.uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        throw new Error('Your artist profile could not be found.');
      }
    });
  }
}
