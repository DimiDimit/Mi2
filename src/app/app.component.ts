import {Component, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

import Swal from 'sweetalert2';
import {AngularFirestore} from '@angular/fire/firestore';
import {ComponentWithProfile} from '../utils/profile-utils';
import {filter, map, mergeMap} from 'rxjs/operators';
import {Title} from '@angular/platform-browser';
import {setTitle} from '../utils/other-utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ComponentWithProfile implements OnInit {
  title = 'Mi2';

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private titleService: Title,
              afAuth: AngularFireAuth, afs: AngularFirestore) {
    super(afAuth, afs);
  }

  ngOnInit() {
    super.ngOnInit();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data),
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
