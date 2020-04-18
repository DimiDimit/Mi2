import {Component, Input, OnInit} from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/storage';

@Component({
  selector: 'app-profile-artist-example-actions',
  templateUrl: './profile-artist-example-actions.component.html',
  styleUrls: ['./profile-artist-example-actions.component.scss']
})
export class ProfileArtistExampleActionsComponent implements OnInit {
  @Input() example: firebase.storage.Reference;
  @Input() replaceExample: (example: firebase.storage.Reference, input: HTMLInputElement) => void;
  @Input() deleteExample: (example: firebase.storage.Reference) => void;

  ngOnInit() {
  }
}
