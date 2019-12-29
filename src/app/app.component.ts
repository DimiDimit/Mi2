import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

import Swal from 'sweetalert2';
import {AngularFirestore} from '@angular/fire/firestore';
import {ComponentWithProfile, getIsAdmin} from '../utils/profile-utils';
import {filter, map, shareReplay, switchMap} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {setTitle} from '../utils/other-utils';
import {Observable, of} from 'rxjs';
import {AngularFireStorage} from '@angular/fire/storage';

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

  constructor(private router: Router, private route: ActivatedRoute, private titleService: Title,
              afAuth: AngularFireAuth, afs: AngularFirestore, private storage: AngularFireStorage) {
    super(afAuth, afs);
    this.isAdmin$ = getIsAdmin(afAuth, afs);
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
      user => this.storage.ref(`profiles/${user.uid}/avatar`).getDownloadURL()));
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
      await this.afAuth.auth.signOut();
      await this.router.navigate(['/']);
    } catch (e) {
      await Swal.fire('Error signing out!', e.toString(), 'error');
    }
  }
}
