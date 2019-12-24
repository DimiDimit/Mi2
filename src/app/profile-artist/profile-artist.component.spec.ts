import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ProfileArtistComponent} from './profile-artist.component';

describe('ProfileArtistComponent', () => {
  let component: ProfileArtistComponent;
  let fixture: ComponentFixture<ProfileArtistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileArtistComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileArtistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
