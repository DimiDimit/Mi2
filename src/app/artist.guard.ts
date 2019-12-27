import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ArtistGuard implements CanActivate {
  constructor(private router: Router, private afAuth: AngularFireAuth, private afs: AngularFirestore) {
  }

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const user = this.afAuth.auth.currentUser;
    if (user == null) {
      return this.router.parseUrl('/signin');
    }
    const doc = await this.afs.firestore.collection('profiles').doc(user.uid).get();
    if (!doc.exists) {
      return false;
    }
    return doc.data().isArtist || this.router.parseUrl('/profile');
  }
}
