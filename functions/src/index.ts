import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// import * as request from 'request-promise-native';
import {Artist, Conversation, Message, PaymentMessage, Report, systemMessageTypes} from '../../src/utils/firestore-types';
import {CallableContext} from 'firebase-functions/lib/providers/https';
import {AccessDeniedError} from '../../src/utils/functions-errors';
import * as moment from 'moment';
import {messageToText} from '../../src/utils/shared-utils';

admin.initializeApp({
  credential: admin.credential.cert(require('../../../service-account-key.json')),
  databaseURL: 'https://d-mi2-1564330446417.firebaseio.com',
  storageBucket: 'd-mi2-1564330446417.appspot.com'
});

function isAdmin(user: admin.auth.UserRecord): boolean | undefined {
  return (user.customClaims as { admin?: boolean; } | undefined)?.admin;
}

async function authOrAdmin(data: any, context: CallableContext): Promise<[string, admin.auth.UserRecord]> {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  let uid = context.auth.uid;
  let user = await admin.auth().getUser(uid);
  if (data && data !== uid) {
    if (!await isAdmin(user)) {
      throw new AccessDeniedError();
    }
    uid = data;
    user = await admin.auth().getUser(uid);
  }
  return [uid, user];
}

async function deleteArtistProfilePure(user: admin.auth.UserRecord) {
  const userDocRef = admin.firestore().collection('artists').doc(user.uid);
  await admin.firestore().runTransaction(async transaction => {
    await transaction.delete(userDocRef);
    await transaction.update(admin.firestore().collection('profiles').doc(user.uid), {isArtist: false});
  });
  await admin.storage().bucket().deleteFiles({
    directory: `artists/${user.uid}`
  });
  const batch = admin.firestore().batch();
  (await admin.firestore().collection('reports').where('reportee', '==', user.uid).get()).forEach(doc => batch.delete(doc.ref));
  (await admin.firestore().collection('conversations').where('artist', '==', user.uid).get()).forEach(doc => batch.delete(doc.ref));
  await batch.commit();
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
  const [uid, user] = await authOrAdmin(data, context);
  const userDoc = await admin.firestore().collection('artists').doc(user.uid).get();
  if (userDoc.exists) {
    await deleteArtistProfilePure(user);
  }
  const batch = admin.firestore().batch();
  (await admin.firestore().collection('reports').where('reporter', '==', uid).get()).forEach(doc => batch.delete(doc.ref));
  (await admin.firestore().collection('conversations').where('profile', '==', uid).get()).forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  await admin.auth().deleteUser(uid);
});
export const deleteArtistProfile = functions.https.onCall(async (data, context) => {
  const [, user] = await authOrAdmin(data, context);
  await deleteArtistProfilePure(user);
});

export const reportArtist = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  if (data.reportee === uid) {
    throw new Error('You can\'t report yourself!');
  }
  const report: Report = {
    reporter: uid,
    reportee: data.reportee,
    message: data.message
  };
  await admin.firestore().collection('reports').add(report);
});

export const messageArtist = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  if (data === uid) {
    throw new Error('You can\'t message yourself!');
  }
  if (!(await admin.firestore().collection('artists').doc(data).get()).exists) {
    throw new Error(`Artist ${data} not found!`);
  }
  const existingConversations = await admin.firestore().collection('conversations')
    .where('profile', '==', uid).where('artist', '==', data).get();
  if (!existingConversations.empty) {
    return existingConversations.docs[0].id;
  }
  const conversation: Conversation = {
    profile: uid,
    artist: data,
    lastTimestamp: admin.firestore.Timestamp.now()
  };
  return (await admin.firestore().collection('conversations').add(conversation)).id;
});

export const onSendMessage = functions.firestore.document('conversations/{cid}/messages/{mid}').onCreate(async (snapshot, context) => {
  const message = snapshot.data()!;
  const hasType = 'type' in message;
  const isSystemMessage = hasType && systemMessageTypes.includes(message.type);
  const conversationDoc = admin.firestore().collection('conversations').doc(context.params.cid);
  const conversation = (await conversationDoc.get()).data()!;
  const profile = conversation.profile;
  const artist = conversation.artist;
  const sender = isSystemMessage ? message.initiator : message.sender;
  const isSenderProfile = profile === sender;
  const senderDoc = (await admin.firestore().collection(isSenderProfile ? 'profiles' : 'artists').doc(sender).get()).data()!;
  const timestamp = admin.firestore.Timestamp.now();
  const updateData: any = {timestamp};
  let content: string;
  if (hasType) {
    content = messageToText(message as Message, senderDoc.name);
  } else {
    content = message.content.substring(0, 1000);
    updateData.content = content;
  }
  await snapshot.ref.update(updateData);
  await conversationDoc.update({
    lastTimestamp: timestamp
  });
  const receiver = isSenderProfile ? artist : profile;
  const tokens = (await Promise.all((await admin.firestore().collection('profiles').doc(receiver)
    .collection('devices').listDocuments()).map(device => device.get().then(d => d.get('messagingToken'))))).filter(d => d);
  if (tokens.length) {
    await admin.messaging().sendMulticast({
      notification: {
        title: 'Mi2 - ' + senderDoc.name,
        body: content,
        imageUrl: (await admin.storage().bucket().file(`profiles/${sender}/avatar`).getSignedUrl({
          action: 'read', expires: moment().add(7, 'days').toDate()
        }))[0]
      },
      android: {
        collapseKey: sender,
        priority: 'high',
        notification: {
          priority: 'high'
        }
      },
      webpush: {
        fcmOptions: {
          link: `https://mi2.dimitrodam.net/messages/${context.params.cid}`
        }
      },
      tokens
    });
  }
});

/*export const sendMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  const uid = context.auth.uid;
  const conversationDoc = admin.firestore().collection('conversations').doc(data.conversation);
  const conversation = await conversationDoc.get();
  if (!conversation.exists) {
    throw new Error(`Conversation ${data.conversation} not found!`);
  }
  if (conversation.get('profile') !== uid && conversation.get('artist') !== uid) {
    throw new Error(`You are not a participant of conversation ${data.conversation}!`);
  }
  const message: Message = {
    sender: uid,
    content: data.content,
    timestamp: admin.firestore.Timestamp.now()
  };
  await conversationDoc.collection('messages').add(message);
});*/

export const requestOrChangePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new AccessDeniedError();
  }
  if (data.conversation == null || data.amount == null) {
    throw new Error('Data object missing properties!');
  }
  if (!(data.amount >= 0.01 && data.amount <= 1000)) {
    throw new Error('Sum must be between 0.01 and 1000!');
  }
  const uid = context.auth.uid;
  const conversationDoc = admin.firestore().collection('conversations').doc(data.conversation);
  const conversation = await conversationDoc.get();
  if (!conversation.exists) {
    throw new Error(`Conversation ${data.conversation} not found!`);
  }
  if (conversation.get('artist') !== uid) {
    throw new Error(`You are not the artist of conversation ${data.conversation}!`);
  }
  const change = conversation.get('requestedAmount') != null;
  await conversationDoc.update({requestedAmount: data.amount});
  const message: PaymentMessage = {
    type: change ? 'change' : 'request',
    initiator: uid,
    amount: data.amount,
    timestamp: admin.firestore.Timestamp.now()
  };
  await conversationDoc.collection('messages').add(message);
});
