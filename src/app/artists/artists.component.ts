import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Artist} from '../../utils/firestore-types';
import {AngularFireStorage} from '@angular/fire/storage';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-artists',
  templateUrl: './artists.component.html',
  styleUrls: ['./artists.component.scss']
})
export class ArtistsComponent implements OnInit {
  private artistsColl: AngularFirestoreCollection<Artist>;
  public artists$: Observable<[Artist & { id: string; }, Observable<string>][]>;

  constructor(private afs: AngularFirestore, private storage: AngularFireStorage) {
    this.artistsColl = this.afs.collection('artists');
    this.artists$ = this.artistsColl.valueChanges({idField: 'id'}).pipe(map(values =>
      values.map(value => [value, this.storage.ref(`artists/${value.id}/avatar`).getDownloadURL()])
    ));
  }

  ngOnInit() {
  }
}
