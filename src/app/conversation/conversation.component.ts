import {AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {setTitle, SubscribingComponent} from '../../utils/other-utils';
import {debounceTime, filter, map, shareReplay, switchMap, takeUntil} from 'rxjs/operators';
import {combineLatest, Observable, Subject} from 'rxjs';
import {Artist, Conversation, Device, Message, Profile} from '../../utils/firestore-types';
import {Title} from '@angular/platform-browser';
import {ActivatedRoute} from '@angular/router';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';
import {AngularFireStorage} from '@angular/fire/storage';
import {compareTimestamps, displayTimestamp} from '../../utils/firebase-utils';
import Swal from 'sweetalert2';
import * as firebase from 'firebase/app';
import 'firebase/firestore';
import {AngularFireMessaging} from '@angular/fire/messaging';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent extends SubscribingComponent implements OnInit, AfterViewInit {
  displayTimestamp = displayTimestamp;

  @ViewChild('messageField', {static: false}) messageField: ElementRef;
  @ViewChild('sendButton', {static: false}) sendButton: ElementRef;
  @ViewChild('sendLoading', {static: false}) sendLoading: ElementRef;
  @ViewChild('messagesDiv', {static: false}) messagesDiv: ElementRef;
  @ViewChildren('messageDiv') messageDiv: QueryList<any>;

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

  constructor(private titleService: Title, private route: ActivatedRoute,
              public afAuth: AngularFireAuth, private afs: AngularFirestore,
              private storage: AngularFireStorage, private afMessaging: AngularFireMessaging) {
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
          .map(message => [message, ...(message.sender === user.uid ? thisProfileAvatar : otherProfileAvatar)] as
            [Message, Profile | Artist, string]))
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
  }

  async sendMessage() {
    try {
      if (!this.messageField.nativeElement.value.trim()) {
        return;
      }
      this.messageField.nativeElement.readOnly = true;
      this.sendButton.nativeElement.disabled = true;
      this.sendLoading.nativeElement.hidden = false;
      const message: Message = {
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
}
