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
  requestedAmount?: number;
}

interface BaseMessage {
  timestamp: firebase.firestore.Timestamp;
}

export interface TextMessage extends BaseMessage {
  sender: string;
  content: string;
}

export interface SystemMessage extends BaseMessage {
  type: string;
  initiator: string;
}

export interface PaymentMessage extends SystemMessage {
  amount: number;
}

export type Message = TextMessage | PaymentMessage;
