import * as firebase from 'firebase/app';
import 'firebase/firestore';
import * as admin from 'firebase-admin';

export interface Profile {
  name: string;
  email: string;
  isArtist: boolean;
  bookmarks?: string[];
}

export interface Device {
  messagingToken?: string;
  showMessaging: boolean;
}

export interface Artist {
  name: string;
  description: string;
  nextExample?: number;
}

export interface Report {
  reporter: string;
  reportee: string;
  message: string;
}

export interface Conversation {
  profile: string;
  artist: string;
  lastTimestamp: firebase.firestore.Timestamp | admin.firestore.Timestamp;
}

export interface Message {
  sender: string;
  content: string;
  timestamp: firebase.firestore.Timestamp;
}
