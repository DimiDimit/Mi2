import {inject, TestBed} from '@angular/core/testing';

import {ArtistGuard} from './artist.guard';

describe('ArtistGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArtistGuard]
    });
  });

  it('should ...', inject([ArtistGuard], (guard: ArtistGuard) => {
    expect(guard).toBeTruthy();
  }));
});
