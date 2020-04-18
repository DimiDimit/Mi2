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

export interface UserMessage extends BaseMessage {
  sender: string;
}

export interface TextMessage extends UserMessage {
  content: string;
}

export interface ImageMessage extends UserMessage {
  type: 'image';
  url: string;
}

export interface FileMessage extends UserMessage {
  type: 'file';
  url: string;
}

export const paymentMessageTypes = ['request', 'complete', 'change', 'tip'] as const;
export const systemMessageTypes = paymentMessageTypes;

export interface SystemMessage extends BaseMessage {
  type: typeof systemMessageTypes[number];
  initiator: string;
}

export interface PaymentMessage extends SystemMessage {
  type: typeof paymentMessageTypes[number];
  amount: number;
}

export type Message = TextMessage | ImageMessage | FileMessage | PaymentMessage;
