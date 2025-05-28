import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpensesChartComponent } from './expenses-chart.component';

describe('ExpensesChartComponent', () => {
  let component: ExpensesChartComponent;
  let fixture: ComponentFixture<ExpensesChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpensesChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
