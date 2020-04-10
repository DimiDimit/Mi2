import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {getIsAdmin} from '../../../utils/profile-utils';
import {Artist, Profile, Report} from '../../../utils/firestore-types';
import {map} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import Swal from 'sweetalert2';

interface ParsedReport {
  id: string;
  reporter: [Observable<Profile>, Observable<string>, string];
  reportee: [Observable<Artist>, Observable<string>, string];
  message: string;
}

@Component({
  selector: 'app-control-panel-reports',
  templateUrl: './control-panel-reports.component.html',
  styleUrls: ['./control-panel-reports.component.scss']
})
export class ControlPanelReportsComponent implements OnInit {
  public isAdmin$: Observable<boolean>;
  private reportsColl: AngularFirestoreCollection<Report>;
  public reports$: Observable<ParsedReport[]>;

  constructor(public afAuth: AngularFireAuth, private afs: AngularFirestore, private storage: AngularFireStorage) {
    this.isAdmin$ = getIsAdmin(afAuth);
    this.reportsColl = afs.collection('reports');
    this.reports$ = this.reportsColl.valueChanges({idField: 'id'}).pipe(map(reports => reports.map(report => ({
      id: report.id,
      reporter: [
        afs.doc<Profile>(`profiles/${report.reporter}`).valueChanges(),
        storage.ref(`profiles/${report.reporter}/avatar`).getDownloadURL(),
        report.reporter
      ], reportee: [
        afs.doc<Artist>(`artists/${report.reportee}`).valueChanges(),
        storage.ref(`artists/${report.reportee}/avatar`).getDownloadURL(),
        report.reportee
      ], message: report.message
    }))));
  }

  ngOnInit() {
  }

  async dismiss(report: string) {
    try {
      await this.reportsColl.doc(report).delete();
    } catch (e) {
      console.error(e);
      await Swal.fire('Error dismissing report', e.toString(), 'error');
    }
  }
}
