import { TestBed } from '@angular/core/testing';

import { Discover } from './discover';

describe('Discover', () => {
  let service: Discover;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Discover);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
