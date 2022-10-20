import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridSettingsComponent } from './grid-settings.component';

describe('GridSettingsComponent', () => {
  let component: GridSettingsComponent;
  let fixture: ComponentFixture<GridSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GridSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
