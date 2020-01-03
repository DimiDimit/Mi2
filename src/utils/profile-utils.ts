import Swal from 'sweetalert2';
import * as firebase from 'firebase';
import {User} from 'firebase';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Artist, Profile} from './firestore-types';
import {combineLatest, Observable, ReplaySubject} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {SubscribingComponent, swalLoading} from './other-utils';
import {OnInit} from '@angular/core';
import {filter, map, takeUntil} from 'rxjs/operators';
import * as _ from 'lodash';

export function callAndNavigate(functions: firebase.functions.Functions, router: Router,
                                callable: string, navigate: any[]): () => Promise<void> {
  return async () => {
    await functions.httpsCallable(callable)();
    await router.navigate(navigate);
  };
}

interface PerformSensitiveActionStrings {
  title: string;
  action: string;
  confirmExtra?: string;
  titlePresent: string;
  actionPresent: string;
  titleDone: string;
  actionDone: string;
}

export async function performSensitiveAction(user: firebase.User, strings: PerformSensitiveActionStrings,
                                             performAction: () => (any | Promise<any>), verify?: () => (any | Promise<any>)) {
  try {
    if (verify != null) {
      await verify();
    }
    const name = user.displayName;
    swalLoading(strings.title, `To ${strings.action}, please sign in again. A popup should've opened.`);
    try {
      await user.reauthenticateWithPopup(new firebase.auth.OAuthProvider(user.providerData[0].providerId));
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') {
        Swal.close();
        return;
      } else {
        // noinspection ExceptionCaughtLocallyJS
        throw e;
      }
    }
    if ((await Swal.fire({
      title: strings.title,
      html: [
        `Are you sure you want to ${strings.action}?`,
        strings.confirmExtra,
        `If so, please enter your name (<b>${_.escape(name)}</b>) below:`
      ].filter(e => e != null).join(' '),
      icon: 'warning',
      input: 'text',
      showCancelButton: true,
      inputPlaceholder: name,
      inputValidator: value => value !== name && 'Please enter your name!'
    })).dismiss !== undefined) {
      return;
    }
    swalLoading(`${strings.titlePresent[0].toUpperCase() + strings.titlePresent.slice(1)}...`,
      `Please wait while ${strings.actionPresent}...`);
    await performAction();
    await Swal.fire(strings.titleDone, `${strings.actionDone}.`, 'success');
  } catch (e) {
    console.error(e);
    await Swal.fire(`Error ${strings.titlePresent[0].toLowerCase() + strings.titlePresent.slice(1)}`, e.toString(), 'error');
  }
}

export abstract class ComponentWithProfile extends SubscribingComponent implements OnInit {
  protected profileDoc: AngularFirestoreDocument<Profile>;
  public profile$: Observable<Profile>;
  protected newProfile$ = new ReplaySubject<User>(1);

  protected constructor(public afAuth: AngularFireAuth, protected afs: AngularFirestore) {
    super();
  }

  ngOnInit() {
    this.afAuth.user.pipe(filter(user => user != null), takeUntil(this.unsubscribe)).subscribe(user => {
      this.profileDoc = this.afs.doc(`profiles/${user.uid}`);
      this.profile$ = this.profileDoc.valueChanges();
      this.newProfile$.next(user);
    });
    this.unsubscribe.subscribe(() => this.newProfile$.complete());
  }
}

export abstract class ComponentWithArtist extends ComponentWithProfile implements OnInit {
  protected artistDoc: AngularFirestoreDocument<Artist>;
  public artist$: Observable<Artist>;

  protected constructor(afAuth: AngularFireAuth, afs: AngularFirestore) {
    super(afAuth, afs);
  }

  ngOnInit() {
    super.ngOnInit();
    this.newProfile$.subscribe(user => {
      this.artistDoc = this.afs.doc(`artists/${user.uid}`);
      this.artist$ = this.artistDoc.valueChanges();
    });
  }
}

export function getIsAdmin(afAuth: AngularFireAuth, afs: AngularFirestore): Observable<boolean> {
  return combineLatest(afAuth.user, afs.doc<{ admins: string[]; }>('other/admins').valueChanges()).pipe(map(
    ([user, admins]) => user != null && admins.admins.includes(user.uid)));
}
