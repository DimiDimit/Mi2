import {ErrorHandler, Injectable} from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {
  async handleError(error: Error) {
    console.error(error);
    try {
      await Swal.fire('Error', error.toString(), 'error');
    } catch {
      alert(error.toString());
    }
  }
}
