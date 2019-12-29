import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ControlPanelReportsComponent} from './control-panel-reports.component';

describe('ControlPanelProfilesComponent', () => {
  let component: ControlPanelReportsComponent;
  let fixture: ComponentFixture<ControlPanelReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ControlPanelReportsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlPanelReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
