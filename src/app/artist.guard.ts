import {Injectable} from '@angular/core';
import {CanActivate, Router, UrlTree} from '@angular/router';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ArtistGuard implements CanActivate {
  constructor(private router: Router, private afAuth: AngularFireAuth, private afs: AngularFirestore) {
  }

  async canActivate(): Promise<boolean | UrlTree> {
    const user = await this.afAuth.user.pipe(take(1)).toPromise();
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
