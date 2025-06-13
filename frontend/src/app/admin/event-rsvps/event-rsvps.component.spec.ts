import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventRsvpsComponent } from './event-rsvps.component';

describe('EventRsvpsComponent', () => {
  let component: EventRsvpsComponent;
  let fixture: ComponentFixture<EventRsvpsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventRsvpsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventRsvpsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
