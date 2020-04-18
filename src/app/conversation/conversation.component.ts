import {AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {imageTypes, setTitle, SubscribingComponent, swalLoading} from '../../utils/other-utils';
import {debounceTime, filter, map, shareReplay, startWith, switchMap, takeUntil} from 'rxjs/operators';
import {combineLatest, fromEvent, Observable, Subject} from 'rxjs';
import {
  Artist,
  Conversation,
  Device,
  FileMessage,
  ImageMessage,
  Message,
  Profile,
  systemMessageTypes,
  TextMessage
} from '../../utils/firestore-types';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {compareTimestamps, displayTimestamp, uploadTaskToPromise} from '../../utils/firebase-utils';
import {v4 as uuidv4} from 'uuid';
import Swal from 'sweetalert2';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {AngularFireMessaging} from '@angular/fire/messaging';
import {AngularFireFunctions} from '@angular/fire/functions';
import {messageToText} from '../../utils/shared-utils';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent extends SubscribingComponent implements OnInit, AfterViewInit {
  displayTimestamp = displayTimestamp;
  messageToText = messageToText;

  @ViewChild('messageField') messageField: ElementRef<HTMLTextAreaElement>;
  @ViewChild('sendButton') sendButton: ElementRef<HTMLButtonElement>;
  @ViewChild('sendLoading') sendLoading: ElementRef<HTMLSpanElement>;
  @ViewChild('messagesDiv') messagesDiv: ElementRef<HTMLDivElement>;
  @ViewChildren('messageDiv') messageDiv: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('file') file: ElementRef<HTMLInputElement>;
  @ViewChildren('file') files: QueryList<ElementRef<HTMLInputElement>>;

  public id: string;
  private conversationDoc: AngularFirestoreDocument<Conversation>;
  public conversation$: Observable<Conversation>;
  public isOtherArtist$: Observable<boolean>;
  public thisProfile$: Observable<Profile>;
  public thisProfileAvatar$: Observable<[Profile | Artist, string]>;
  private otherId$: Observable<string>;
  public otherProfile$: Observable<Profile | Artist>;
  public otherAvatar$: Observable<string>;
  public otherProfileAvatar$: Observable<[Profile | Artist, string]>;
  private messagesColl: AngularFirestoreCollection<Message>;
  public messages$: Observable<[Message, Profile | Artist, string][]>;
  public device$: Observable<Device>;
  private newConversation$ = new Subject();
  public fileLoading = false;
  public fileEmpty$: Observable<boolean>;

  constructor(private titleService: Title, private route: ActivatedRoute,
              public afAuth: AngularFireAuth, private afs: AngularFirestore,
              private storage: AngularFireStorage, private fns: AngularFireFunctions,
              private afMessaging: AngularFireMessaging) {
    super();
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
      this.id = params.get('id');
      this.conversationDoc = this.afs.doc(`conversations/${this.id}`);
      this.conversation$ = this.conversationDoc.valueChanges();
      this.isOtherArtist$ = combineLatest([this.afAuth.user, this.conversation$]).pipe(
        map(([user, conversation]) => conversation?.profile === user?.uid), shareReplay(1));
      this.thisProfile$ = this.afAuth.user.pipe(switchMap(user => this.afs.doc<Profile>(`profiles/${user.uid}`).valueChanges()));
      this.thisProfileAvatar$ = combineLatest([this.afAuth.user, this.isOtherArtist$]).pipe(
        switchMap(([user, isOtherArtist]) => {
          const path = `${isOtherArtist ? 'profiles' : 'artists'}/${user.uid}`;
          return combineLatest([
            this.afs.doc<Profile | Artist>(path).valueChanges(),
            this.storage.ref(`${path}/avatar`).getDownloadURL()
          ]);
        })
      );
      this.otherId$ = combineLatest([this.conversation$, this.isOtherArtist$]).pipe(
        map(([conversation, isOtherArtist]) => isOtherArtist ? conversation?.artist : conversation?.profile));
      this.otherProfile$ = combineLatest([this.isOtherArtist$, this.otherId$]).pipe(switchMap(([isOtherArtist, otherId]) =>
        this.afs.doc<Profile | Artist>(`${isOtherArtist ? 'artists' : 'profiles'}/${otherId}`).valueChanges()));
      this.otherAvatar$ = combineLatest([this.isOtherArtist$, this.otherId$]).pipe(switchMap(([isOtherArtist, otherId]) =>
        this.storage.ref(`${isOtherArtist ? 'artists' : 'profiles'}/${otherId}/avatar`).getDownloadURL()));
      this.otherProfileAvatar$ = combineLatest([this.otherProfile$, this.otherAvatar$]).pipe(shareReplay(1));
      this.messagesColl = this.afs.collection(`conversations/${this.id}/messages`);
      this.messages$ = combineLatest([this.afAuth.user, this.thisProfileAvatar$, this.otherProfileAvatar$,
        this.messagesColl.valueChanges()]).pipe(
        map(([user, thisProfileAvatar, otherProfileAvatar, messages]) => messages
          .sort((a, b) => compareTimestamps(a.timestamp, b.timestamp))
          .map(message => [message, ...(('sender' in message ? message.sender : message.initiator) === user.uid ?
            thisProfileAvatar : otherProfileAvatar)] as [Message, Profile | Artist, string]))
      );
      this.device$ = this.afAuth.user.pipe(switchMap(user =>
        this.afs.doc<Device>(`profiles/${user.uid}/devices/${localStorage.getItem('deviceId')}`).valueChanges()));
      this.newConversation$.next();
      this.otherProfile$.pipe(takeUntil(this.newConversation$), takeUntil(this.unsubscribe)).subscribe(otherProfile => {
        setTitle(this.titleService, [otherProfile?.name || 'Not found', 'Messages']);
      });
    });
    this.unsubscribe.subscribe(() => this.newConversation$.complete());
  }

  ngAfterViewInit() {
    this.messageDiv.changes.pipe(takeUntil(this.unsubscribe), filter(changes => changes?.length > 0), debounceTime(500)).subscribe(() =>
      this.messagesDiv.nativeElement.scrollTop = this.messagesDiv.nativeElement.scrollHeight);
    this.fileEmpty$ = (this.files.changes as Observable<QueryList<ElementRef<HTMLInputElement>>>).pipe(
      filter(changes => changes?.length > 0),
      switchMap(changes => fromEvent(changes.first.nativeElement, 'change')),
      map(event => !(event.target as HTMLInputElement).files.length),
      startWith(true));
  }

  async sendMessage() {
    try {
      if (!this.messageField.nativeElement.value.trim()) {
        return;
      }
      this.messageField.nativeElement.readOnly = true;
      this.sendButton.nativeElement.disabled = true;
      this.sendLoading.nativeElement.hidden = false;
      const message: TextMessage = {
        sender: this.afAuth.auth.currentUser.uid,
        content: this.messageField.nativeElement.value,
        timestamp: firebase.firestore.Timestamp.now()
      };
      await this.messagesColl.add(message);
      this.messageField.nativeElement.value = '';
      this.messageField.nativeElement.readOnly = false;
      this.sendButton.nativeElement.disabled = false;
      this.sendLoading.nativeElement.hidden = true;
    } catch (e) {
      console.error(e);
      await Swal.fire('Error sending message', e.toString(), 'error');
    }
  }

  requestNotifications(event: Event) {
    event.preventDefault();
    this.afMessaging.requestToken.pipe(takeUntil(this.unsubscribe)).subscribe({
      next: token => this.afs.doc(`profiles/${this.afAuth.auth.currentUser.uid}/devices/${localStorage.getItem('deviceId')}`)
        .update({messagingToken: token, showMessaging: false}),
      error: async () => {
        await Swal.fire({
          icon: 'error',
          title: 'Notifications disabled',
          text: 'The notifications permission has been denied, notifications have been disabled. To enable them, go to "My profile".'
        });
        await this.disableNotifications();
      }
    });
  }

  isSystemMessage(message: Message): boolean {
    return 'type' in message && (systemMessageTypes as ReadonlyArray<string>).includes(message.type);
  }

  getMessageType(message: Message): string {
    return 'type' in message && message.type;
  }

  getMessageUrl(message: Message): string {
    return (message as ImageMessage | FileMessage).url;
  }

  async dismissNotifications() {
    await Swal.fire({
      icon: 'info',
      title: 'Notifications disabled',
      text: 'If you would like to enable notifications later, go to "My profile".'
    });
    await this.disableNotifications();
  }

  disableNotifications() {
    return this.afs.doc(`profiles/${this.afAuth.auth.currentUser.uid}/devices/${localStorage.getItem('deviceId')}`)
      .update({showMessaging: false});
  }

  async requestPayment() {
    const change = (await this.conversationDoc.ref.get()).get('requestedAmount') != null;
    try {
      const value = (await Swal.fire({
        title: change ? 'Change requested sum' : 'Request payment',
        text: `Enter the ${change ? 'new ' : ''}sum to request:`,
        input: 'number',
        showCancelButton: true,
        inputValidator: val => {
          const v = parseFloat(val);
          if (isNaN(v)) {
            return 'Please enter a number!';
          }
          return !(v >= 0.01 && v <= 1000) && 'Enter a number between 0.01 and 1000!';
        }
      })).value;
      if (value === undefined) {
        return;
      }
      swalLoading(change ? 'Changing requested sum...' : 'Requesting payment...',
        `Please wait while ${change ? 'the requested sum is being changed' : 'payment is being requested'}...`);
      await this.fns.functions.httpsCallable('requestOrChangePayment')({conversation: this.id, amount: parseFloat(value)});
      await Swal.fire(change ? 'Requested sum changed' : 'Payment requested',
        (change ? 'The requested sum has been changed' : 'Payment has been requested') + ' successfully.', 'success');
    } catch (e) {
      console.error(e);
      await Swal.fire('Error ' + (change ? 'changing sum' : 'requesting payment'), e.toString(), 'error');
    }
  }

  async sendFile() {
    try {
      const files = this.file.nativeElement.files;
      if (!files.length) {
        return;
      }
      const isImage = imageTypes.includes(files[0].type);
      if (files[0].size >= 20 * 1024 * 1024) {
        throw new Error('The file you selected is too large! The maximum file size is 20 MiB.');
      }
      this.fileLoading = true;
      const uid = this.afAuth.auth.currentUser.uid;
      const conversation = (await this.conversationDoc.ref.get()).data();
      const otherId = conversation.profile === uid ? conversation.artist : conversation.profile;
      const file = this.storage.storage.ref(`conversations/${uid}/${otherId}/${uuidv4()}.${files[0].name.split('.').pop()}`);
      await uploadTaskToPromise(file.put(files[0]));
      const message: ImageMessage | FileMessage = {
        type: isImage ? 'image' : 'file',
        sender: uid,
        url: await file.getDownloadURL(),
        timestamp: firebase.firestore.Timestamp.now()
      };
      await this.messagesColl.add(message as Message);
      Swal.close();
    } catch (e) {
      console.error(e);
      await Swal.fire('Error sending image', e.toString(), 'error');
    } finally {
      this.fileLoading = false;
    }
  }
}
