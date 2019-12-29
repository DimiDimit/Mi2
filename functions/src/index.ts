import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// import * as request from 'request-promise-native';
import {Artist, Report} from '../../src/utils/firestore-types';

export class AccessDeniedError extends Error {
  constructor(message = 'Access denied.') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

admin.initializeApp({
  credential: admin.credential.cert(require('../../../service-account-key.json')),
  databaseURL: 'https://d-mi2-1564330446417.firebaseio.com'
});

async function deleteArtistProfilePure(user: admin.auth.UserRecord) {
  const userDocRef = admin.firestore().collection('artists').doc(user.uid);
  await admin.firestore().runTransaction(async transaction => {
    await transaction.delete(userDocRef);
    await transaction.update(admin.firestore().collection('profiles').doc(user.uid), {isArtist: false});
  });
  await admin.storage().bucket().deleteFiles({
    directory: `artists/${user.uid}`
  });
}

export const becomeArtist = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  const user = await admin.auth().getUser(uid);
  await admin.firestore().runTransaction(async transaction => {
    const docRef = admin.firestore().collection('artists').doc(uid);
    const doc = await transaction.get(docRef);
    await transaction.update(admin.firestore().collection('profiles').doc(uid), {isArtist: true});
    if (!doc.exists) {
      const artist: Artist = {
        name: user.displayName!,
        description: ''
      };
      transaction.set(docRef, artist);
    }
  });
  // Uncomment when you create your billing profile.
  /*await request(user.photoURL!).on('response', response => {
    response.pipe(admin.storage().bucket().file(`artists/${uid}/avatar`).createWriteStream({
      metadata: {
        contentType: response.headers['content-type'] || 'image/png'
      }
    }));
  });*/
});
export const deleteProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  const user = await admin.auth().getUser(uid);
  const userDoc = await admin.firestore().collection('artists').doc(user.uid).get();
  if (userDoc.exists) {
    await deleteArtistProfilePure(user);
  }
  await admin.auth().deleteUser(uid);
});
export const deleteArtistProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  const user = await admin.auth().getUser(uid);
  await deleteArtistProfilePure(user);
});

export const reportArtist = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  const report: Report = {
    reporter: uid,
    reportee: data.reportee,
    message: data.message
  };
  await admin.firestore().collection('reports').add(report);
});
