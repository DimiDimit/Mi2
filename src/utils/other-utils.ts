import Swal from 'sweetalert2';
import {OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {Title} from '@angular/platform-browser';

export const imageTypes = ['image/apng', 'image/bmp', 'image/gif', 'image/x-icon', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];

export function swalLoading(title: string | HTMLElement | JQuery | undefined, text: string | undefined): void {
  // noinspection JSIgnoredPromiseFromCall
  Swal.fire({
    title,
    text,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEnterKey: false,
    allowEscapeKey: false
  });
}

export function setTitle(titleService: Title, title: string | string[] | undefined | null) {
  let titleArray = ['Mi2'];
  if (Array.isArray(title)) {
    titleArray = title.concat(titleArray);
  } else if (title != null) {
    titleArray.unshift(title);
  }
  titleService.setTitle(titleArray.join(' – '));
}

export abstract class SubscribingComponent implements OnDestroy {
  protected unsubscribe = new Subject<void>();

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
