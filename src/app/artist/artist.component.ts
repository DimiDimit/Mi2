import {Component, OnInit} from '@angular/core';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Artist} from '../../utils/firestore-types';
import {Observable, Subject} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {takeUntil} from 'rxjs/operators';
import {AngularFireStorage} from '@angular/fire/storage';
import {setTitle, SubscribingComponent} from '../../utils/other-utils';
import {Title} from '@angular/platform-browser';

@Component({
  selector: 'app-artist',
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.scss']
})
export class ArtistComponent extends SubscribingComponent implements OnInit {
  public id: string;
  private artistDoc: AngularFirestoreDocument<Artist>;
  public artist$: Observable<Artist>;
  public avatar$: Observable<string>;
  private newArtist$ = new Subject();

  constructor(private titleService: Title, private route: ActivatedRoute,
              private afs: AngularFirestore, private storage: AngularFireStorage) {
    super();
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.unsubscribe)).subscribe(params => {
      this.id = params.get('id');
      this.artistDoc = this.afs.doc(`artists/${this.id}`);
      this.artist$ = this.artistDoc.valueChanges();
      this.avatar$ = this.storage.ref(`artists/${this.id}/avatar`).getDownloadURL();
      this.newArtist$.next();
      this.artist$.pipe(takeUntil(this.newArtist$)).subscribe(artist => {
        setTitle(this.titleService, [artist.name, 'Artists']);
      });
    });
    this.unsubscribe.subscribe(() => this.newArtist$.complete());
  }
}
