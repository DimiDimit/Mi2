import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

import Swal from 'sweetalert2';
import {AngularFirestore} from '@angular/fire/firestore';
import {ComponentWithProfile, getIsAdmin} from '../utils/profile-utils';
import {catchError, filter, map, shareReplay, switchMap} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {setTitle} from '../utils/other-utils';
import {Observable, of} from 'rxjs';
import {AngularFireStorage} from '@angular/fire/storage';
import {AngularFireMessaging} from '@angular/fire/messaging';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ComponentWithProfile implements OnInit {
  title = 'Mi2';

  private route$: Observable<ActivatedRoute>;
  isAdmin$: Observable<boolean>;
  inControlPanel$: Observable<boolean>;
  avatar$: Observable<string>;

  /* newMessage$: Observable<any>;
  newMessageDismiss$ = new Subject<any>();*/

  constructor(private router: Router, private route: ActivatedRoute, private titleService: Title,
              afAuth: AngularFireAuth, afs: AngularFirestore, private storage: AngularFireStorage,
              private afMessaging: AngularFireMessaging) {
    super(afAuth, afs);
    this.isAdmin$ = getIsAdmin(afAuth);
    this.route$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.route)
    );
    this.inControlPanel$ = this.route$.pipe(
      switchMap(currentRoute => currentRoute.firstChild?.url || of(null)),
      map(segments => segments[0]?.path === 'control-panel'),
      shareReplay(1)
    );
    this.avatar$ = this.newProfile$.pipe(switchMap(
      user => this.storage.ref(`profiles/${user.uid}/avatar`).getDownloadURL()
        .pipe(catchError(() => of(user.photoURL)))));
    // this.newMessage$ = merge(afMessaging.messages, this.newMessageDismiss$);
  }

  ngOnInit() {
    super.ngOnInit();
    this.route$.pipe(
      map(currentRoute => {
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }
        return currentRoute;
      }),
      filter(currentRoute => currentRoute.outlet === 'primary'),
      switchMap(route => route.data),
      filter(route => route.title !== null))
      .subscribe(event => {
        setTitle(this.titleService, event.title);
      });
  }

  async signOut() {
    try {
      const deviceId = localStorage.getItem('deviceId');
      if (deviceId != null) {
        const deviceDoc = this.afs.doc(`profiles/${this.afAuth.auth.currentUser.uid}/devices/${deviceId}`);
        const messagingToken = (await deviceDoc.ref.get()).get('messagingToken');
        if (messagingToken != null) {
          this.afMessaging.deleteToken(messagingToken);
        }
        await deviceDoc.delete();
        localStorage.removeItem('deviceId');
      }
      await this.afAuth.auth.signOut();
      await this.router.navigate(['/']);
    } catch (e) {
      console.error(e);
      await Swal.fire('Error signing out!', e.toString(), 'error');
    }
  }
}
