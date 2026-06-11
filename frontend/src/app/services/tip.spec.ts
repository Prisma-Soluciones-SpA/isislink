import { TestBed } from '@angular/core/testing';

import { Tip } from './tip';

describe('Tip', () => {
  let service: Tip;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tip);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
