import {Component, Input, OnInit} from '@angular/core';
import * as firebase from 'firebase';

@Component({
  selector: 'app-profile-artist-example-actions',
  templateUrl: './profile-artist-example-actions.component.html',
  styleUrls: ['./profile-artist-example-actions.component.scss']
})
export class ProfileArtistExampleActionsComponent implements OnInit {
  @Input() example: firebase.storage.Reference;
  @Input() replaceExample: (example: firebase.storage.Reference, input: HTMLInputElement) => any;
  @Input() deleteExample: (example: firebase.storage.Reference) => any;

  constructor() {
  }

  ngOnInit() {
  }
}
