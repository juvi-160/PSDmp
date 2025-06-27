import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembershipSelectionComponent } from './membership-selection.component';

describe('MembershipSelectionComponent', () => {
  let component: MembershipSelectionComponent;
  let fixture: ComponentFixture<MembershipSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MembershipSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembershipSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
