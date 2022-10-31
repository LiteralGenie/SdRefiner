import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RezInputComponent } from './rez-input.component';

describe('RezInputComponent', () => {
  let component: RezInputComponent;
  let fixture: ComponentFixture<RezInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RezInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RezInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
