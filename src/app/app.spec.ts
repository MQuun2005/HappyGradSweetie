import { TestBed } from '@angular/core/testing';

import { appConfig } from './app.config';
import { App } from './app';

describe('App', () => {
  it('creates the root component', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();

    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});
