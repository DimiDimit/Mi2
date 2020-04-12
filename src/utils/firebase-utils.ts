import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import * as moment from 'moment';

/*export async function deleteFirebaseStorageFolder(dir: firebase.storage.Reference) {
  const dirList = await dir.listAll();
  for (const file of dirList.items) {
    await file.delete();
  }
  for (const folder of dirList.prefixes) {
    await deleteFirebaseStorageFolder(folder);
  }
}*/

export function uploadTaskToPromise(task: firebase.storage.UploadTask): Promise<firebase.storage.UploadTaskSnapshot> {
  return new Promise((resolve, reject) => {
    task.on(firebase.storage.TaskEvent.STATE_CHANGED, null, reject, resolve);
  });
  // return new Promise<UploadTaskSnapshot>((resolve, reject) => task.then(resolve, reject));
}

export function compareTimestamps(a: firebase.firestore.Timestamp, b: firebase.firestore.Timestamp, descending: boolean = false): number {
  return descending ? b.toMillis() - a.toMillis() : a.toMillis() - b.toMillis();
}

export function displayTimestamp(timestamp: firebase.firestore.Timestamp, absolute: boolean = false): string {
  const time = moment(timestamp.toMillis());
  // noinspection SpellCheckingInspection
  return absolute ? time.format('llll') : time.fromNow();
}
