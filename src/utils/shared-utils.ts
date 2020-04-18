import {Message} from './firestore-types';

export function messageToText(message: Message, initiatorName: string): string {
  if ('content' in message) {
    return message.content;
  }
  switch (message.type) {
    case 'image':
      return `${initiatorName} sent an image.`;
    case 'file':
      return `${initiatorName} sent a file.`;
    case 'request':
      return `${initiatorName} is requesting a payment of $${message.amount}.`;
    case 'complete':
      return `${initiatorName} paid the requested sum of $${message.amount}.`;
    case 'change':
      return `${initiatorName} changed the requested sum to $${message.amount}.`;
    case 'tip':
      return `${initiatorName} left a tip of $${message.amount}.`;
    default:
      return 'Message type unknown.';
  }
}

/* export function messageToObservable(message: Observable<Message>): Observable<string> {
  return message.pipe(map(messageToText));
}*/
