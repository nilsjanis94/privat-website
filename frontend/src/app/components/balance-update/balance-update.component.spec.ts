import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceUpdateComponent } from './balance-update.component';

describe('BalanceUpdateComponent', () => {
  let component: BalanceUpdateComponent;
  let fixture: ComponentFixture<BalanceUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
