import * as firebase from 'firebase';
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;

/*export async function deleteFirebaseStorageFolder(dir: firebase.storage.Reference) {
  const dirList = await dir.listAll();
  for (const file of dirList.items) {
    await file.delete();
  }
  for (const folder of dirList.prefixes) {
    await deleteFirebaseStorageFolder(folder);
  }
}*/

export function uploadTaskToPromise(task: firebase.storage.UploadTask): Promise<UploadTaskSnapshot> {
  /*return new Promise((resolve, reject) => {
    task.on(firebase.storage.TaskEvent.STATE_CHANGED, null, reject, resolve);
  });*/
  return new Promise<UploadTaskSnapshot>((resolve, reject) => task.then(resolve, reject));
}
