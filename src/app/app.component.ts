import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

import Swal from 'sweetalert2';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {ComponentWithProfile} from '../utils/profile-utils';
import {filter, map, shareReplay, switchMap} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {setTitle} from '../utils/other-utils';
import {combineLatest, Observable, of} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ComponentWithProfile implements OnInit {
  title = 'Mi2';

  private route$: Observable<ActivatedRoute>;
  private adminsDoc: AngularFirestoreDocument<{ admins: string[] }>;
  isAdmin$: Observable<boolean>;
  inControlPanel$: Observable<boolean>;

  constructor(private router: Router, private route: ActivatedRoute, private titleService: Title,
              afAuth: AngularFireAuth, afs: AngularFirestore) {
    super(afAuth, afs);
    this.adminsDoc = afs.doc('other/admins');
    this.isAdmin$ = combineLatest(afAuth.user, this.adminsDoc.valueChanges()).pipe(map(
      ([user, admins]) => user != null && admins.admins.includes(user.uid)));
    this.route$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.route)
    );
    this.inControlPanel$ = this.route$.pipe(
      switchMap(currentRoute => currentRoute.firstChild?.url || of(null)),
      map(segments => segments[0]?.path === 'control-panel'),
      shareReplay(1)
    );
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
