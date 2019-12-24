import {Pipe, PipeTransform} from '@angular/core';
import {catchError, map, startWith} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

@Pipe({
  name: 'withLoading'
})
export class WithLoadingPipe implements PipeTransform {
  transform<T>(val: Observable<T>): Observable<{ loading: boolean } & ({ value: T } | {} | { error: any })> {
    return val.pipe(
      map((value: any) => ({
        loading: value.type === 'start',
        value: value.type ? value.value : value
      })),
      startWith({loading: true}),
      catchError(error => of({loading: false, error}))
    );
  }
}
