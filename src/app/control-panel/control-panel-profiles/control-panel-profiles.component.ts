import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Observable} from 'rxjs';
import {getIsAdmin} from '../../../utils/profile-utils';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Profile} from '../../../utils/firestore-types';
import {map} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import Swal from 'sweetalert2';
import {swalLoading} from '../../../utils/other-utils';
import {AngularFireFunctions} from '@angular/fire/functions';
import * as _ from 'lodash';

@Component({
  selector: 'app-control-panel-profiles',
  templateUrl: './control-panel-profiles.component.html',
  styleUrls: ['./control-panel-profiles.component.scss']
})
export class ControlPanelProfilesComponent implements OnInit {
  public isAdmin$: Observable<boolean>;
  private profilesColl: AngularFirestoreCollection<Profile>;
  public profiles$: Observable<[Profile & { id: string; }, Observable<string>][]>;

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore,
              private storage: AngularFireStorage, private fns: AngularFireFunctions) {
    this.isAdmin$ = getIsAdmin(afAuth, afs);
    this.profilesColl = this.afs.collection('profiles');
    this.profiles$ = this.profilesColl.valueChanges({idField: 'id'}).pipe(
      map(profiles => profiles.map(profile =>
        [
          profile,
          this.storage.ref(`profiles/${profile.id}/avatar`).getDownloadURL()
        ]))
    );
  }

  ngOnInit() {
  }

  async delete(profile: Profile & { id: string; }) {
    try {
      if (!(await Swal.fire({
        title: 'Delete profile',
        html: `Are you sure you want to delete the profile <b>${_.escape(profile.name)}</b>? This action cannot be undone!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete'
      })).value) {
        return;
      }
      swalLoading('Deleting profile...', 'Please wait while the profile is being deleted...');
      await this.fns.functions.httpsCallable('deleteProfile')(profile.id);
      await Swal.fire('Profile deleted', 'Profile deleted successfully.', 'success');
    } catch (e) {
      await Swal.fire('Error deleting profile', e.toString(), 'error');
    }
  }
}
