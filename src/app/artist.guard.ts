import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ArtistGuard implements CanActivate {
  constructor(private router: Router, private afAuth: AngularFireAuth, private afs: AngularFirestore) {
  }

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const doc = await this.afs.firestore.collection('profiles').doc((await this.afAuth.user.pipe(take(1)).toPromise()).uid).get();
    if (!doc.exists) {
      return false;
    }
    return doc.data().isArtist || this.router.parseUrl('/profile');
  }
}
