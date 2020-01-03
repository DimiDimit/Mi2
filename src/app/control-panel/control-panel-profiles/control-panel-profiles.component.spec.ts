import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ControlPanelProfilesComponent} from './control-panel-profiles.component';

describe('ControlPanelProfilesComponent', () => {
  let component: ControlPanelProfilesComponent;
  let fixture: ComponentFixture<ControlPanelProfilesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ControlPanelProfilesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlPanelProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
