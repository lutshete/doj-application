import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeetingResponseComponent } from './meeting-response.component';

describe('MeetingResponseComponent', () => {
  let component: MeetingResponseComponent;
  let fixture: ComponentFixture<MeetingResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeetingResponseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MeetingResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
