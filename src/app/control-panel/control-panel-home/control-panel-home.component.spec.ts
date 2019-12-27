import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ControlPanelHomeComponent} from './control-panel-home.component';

describe('ControlPanelHomeComponent', () => {
  let component: ControlPanelHomeComponent;
  let fixture: ComponentFixture<ControlPanelHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ControlPanelHomeComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlPanelHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
