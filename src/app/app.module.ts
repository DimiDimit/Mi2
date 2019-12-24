import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {SignInComponent} from './sign-in/sign-in.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {AngularFireAuthGuard, AngularFireAuthGuardModule, redirectLoggedInTo, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {ArtistsComponent} from './artists/artists.component';
import {ArtistComponent} from './artist/artist.component';
import {ProfileComponent} from './profile/profile.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FirebaseUIModule} from 'firebaseui-angular';
import * as firebase from 'firebase';
import {ProfileArtistComponent} from './profile-artist/profile-artist.component';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {ArtistGuard} from './artist.guard';
import {AngularFireStorageModule} from '@angular/fire/storage';
import {ServiceWorkerModule} from '@angular/service-worker';
import {ErrorService} from './error.service';
import {AngularFireFunctionsModule} from '@angular/fire/functions';
import {ReactiveFormsModule} from '@angular/forms';
import {WithLoadingPipe} from './with-loading.pipe';
import {LoadingComponent} from './loading/loading.component';

const redirectUnauthorized = () => redirectUnauthorizedTo(['/signin']);
const redirectLoggedIn = () => redirectLoggedInTo(['/']);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SignInComponent,
    NotFoundComponent,
    ArtistsComponent,
    ArtistComponent,
    ProfileComponent,
    ProfileArtistComponent,
    WithLoadingPipe,
    LoadingComponent
  ],
  imports: [
    NgbModule,
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {path: 'home', component: HomeComponent, data: {title: 'Home'}},
      {
        path: 'signin',
        component: SignInComponent,
        canActivate: [AngularFireAuthGuard],
        data: {authGuardPipe: redirectLoggedIn, title: 'Sign in'}
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AngularFireAuthGuard],
        data: {authGuardPipe: redirectUnauthorized, title: 'Profile'}
      },
      {
        path: 'profile-artist',
        component: ProfileArtistComponent,
        canActivate: [AngularFireAuthGuard, ArtistGuard],
        data: {authGuardPipe: redirectUnauthorized, title: 'Artist profile'}
      },
      {path: 'artists/:id', component: ArtistComponent, data: {title: null}},
      {path: 'artists', component: ArtistsComponent, data: {title: 'Artists'}},
      {path: '', redirectTo: '/home', pathMatch: 'full'},
      {path: '**', component: NotFoundComponent, pathMatch: 'full', data: {title: 'Not found'}}
    ]),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireAuthGuardModule,
    FirebaseUIModule.forRoot({
      signInFlow: 'popup',
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        firebase.auth.GithubAuthProvider.PROVIDER_ID
      ]
    }),
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
    ReactiveFormsModule
  ],
  providers: [
    {provide: ErrorHandler, useClass: ErrorService},
    // {provide: FUNCTIONS_ORIGIN, useValue: 'http://localhost:5001'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
