import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ProfileArtistExampleActionsComponent} from './profile-artist-example-actions.component';

describe('ExampleActionsComponent', () => {
  let component: ProfileArtistExampleActionsComponent;
  let fixture: ComponentFixture<ProfileArtistExampleActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileArtistExampleActionsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileArtistExampleActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
