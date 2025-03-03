import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidatorsComponent } from './liquidators.component';

describe('LiquidatorsComponent', () => {
  let component: LiquidatorsComponent;
  let fixture: ComponentFixture<LiquidatorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidatorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiquidatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
