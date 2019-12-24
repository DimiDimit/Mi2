import {ErrorHandler, Injectable} from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {
  constructor() {
  }

  handleError(error: any): void {
    console.error(error);
    try {
      Swal.fire('Error', error.toString(), 'error');
    } catch {
      alert(error.toString());
    }
  }
}
