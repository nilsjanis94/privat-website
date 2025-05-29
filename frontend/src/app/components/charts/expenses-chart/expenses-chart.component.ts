import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { InventoryService } from '../../../services/inventory.service';

// Chart.js Module registrieren
Chart.register(...registerables);

interface ChartDataPoint {
  date: string;
  label: string;
  amount: number;
  items_count: number;
}

interface ExpensesChartResponse {
  period: string;
  data_points: ChartDataPoint[];
  total_amount: number;
  total_items: number;
}

@Component({
  selector: 'app-expenses-chart',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './expenses-chart.component.html',
  styleUrl: './expenses-chart.component.scss'
})
export class ExpensesChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  selectedPeriod = '1W';
  isLoading = false;
  chartResponse: ExpensesChartResponse | null = null;
  lastLoadedPeriod = ''; // Jetzt public statt private
  private chart: Chart | null = null;

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  ngAfterViewInit(): void {
    // Chart wird nach Datenload erstellt
  }

  onPeriodChange(newPeriod: string): void {
    console.log('=== PERIOD CHANGE EVENT ===');
    console.log('Event triggered with period:', newPeriod);
    console.log('Current selectedPeriod:', this.selectedPeriod);
    console.log('lastLoadedPeriod:', this.lastLoadedPeriod);
    
    // Verhindere mehrfache Calls für denselben Zeitraum
    if (newPeriod === this.lastLoadedPeriod && this.chartResponse) {
      console.log('Same period already loaded, skipping');
      return;
    }
    
    this.selectedPeriod = newPeriod;
    this.destroyChart();
    this.chartResponse = null;
    this.loadChartData();
  }

  loadChartData(): void {
    console.log('=== LOADING DATA ===');
    console.log('Loading period:', this.selectedPeriod);
    
    // Verhindere doppelte Calls
    if (this.isLoading) {
      console.log('Already loading, skipping');
      return;
    }
    
    this.isLoading = true;
    this.lastLoadedPeriod = this.selectedPeriod; // Markiere als wird geladen
    
    this.inventoryService.getExpensesChartData(this.selectedPeriod).subscribe({
      next: (response: ExpensesChartResponse) => {
        console.log('=== API RESPONSE ===');
        console.log('Period from API:', response.period);
        console.log('Data points count:', response.data_points?.length);
        
        // Prüfe ob Response noch aktuell ist
        if (response.period !== this.selectedPeriod) {
          console.log('Response outdated, ignoring');
          this.isLoading = false;
          return;
        }
        
        this.chartResponse = {
          period: response.period,
          data_points: [...response.data_points],
          total_amount: response.total_amount,
          total_items: response.total_items
        };
        
        console.log('Response processed, creating chart...');
        this.isLoading = false;
        
        setTimeout(() => {
          this.createChart();
        }, 100);
      },
      error: (error) => {
        console.error('=== API ERROR ===', error);
        this.isLoading = false;
        this.lastLoadedPeriod = ''; // Reset bei Fehler
      }
    });
  }

  private destroyChart(): void {
    if (this.chart) {
      console.log('Destroying existing chart');
      this.chart.destroy();
      this.chart = null;
    }
  }

  private createChart(): void {
    console.log('=== CREATING CHART ===');
    console.log('chartResponse for chart creation:', this.chartResponse);
    
    if (!this.chartResponse || !this.chartCanvas) {
      console.log('Missing data or canvas element');
      return;
    }

    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('Could not get canvas context');
      return;
    }

    const labels = this.chartResponse.data_points.map(point => point.label);
    const data = this.chartResponse.data_points.map(point => point.amount);

    console.log('Chart creation - labels:', labels);
    console.log('Chart creation - data:', data);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `Ausgaben (€) - ${this.selectedPeriod}`,
          data: data,
          borderColor: '#8b5cf6', // Primary Purple
          backgroundColor: 'rgba(139, 92, 246, 0.1)', // Primary Purple with low opacity
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8b5cf6', // Primary Purple
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#7c3aed', // Primary 600
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#374151',
              font: {
                size: 13,
                family: 'Inter, system-ui, sans-serif',
                weight: 600
              },
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            cornerRadius: 12,
            titleFont: {
              size: 14,
              family: 'Inter, system-ui, sans-serif',
              weight: 600
            },
            bodyFont: {
              size: 13,
              family: 'Inter, system-ui, sans-serif'
            },
            callbacks: {
              label: (context) => {
                return `Ausgaben: ${context.parsed.y.toFixed(2)}€`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(139, 92, 246, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: '#6b7280',
              font: { 
                size: 11,
                family: 'Inter, system-ui, sans-serif',
                weight: 500
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(139, 92, 246, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: '#6b7280',
              font: { 
                size: 11,
                family: 'Inter, system-ui, sans-serif',
                weight: 500
              },
              callback: function(value) {
                return value + '€';
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    console.log('Chart created successfully');
  }

  getPeriodDescription(): string {
    const descriptions: { [key: string]: string } = {
      '1W': 'Letzte 7 Tage', 
      '1M': 'Letzten 30 Tage',
      '1Y': 'Letzten 12 Monate',
      'MAX': 'Alle Daten'
    };
    return descriptions[this.selectedPeriod] || '';
  }

  getAverage(): number {
    console.log('getAverage() called with chartResponse:', this.chartResponse);
    if (!this.chartResponse?.data_points?.length) return 0;
    
    const nonZeroValues = this.chartResponse.data_points
      .map(p => p.amount)
      .filter(amount => amount > 0);
    
    console.log('getAverage() nonZeroValues:', nonZeroValues);
    
    if (nonZeroValues.length === 0) return 0;
    
    const average = nonZeroValues.reduce((sum, amount) => sum + amount, 0) / nonZeroValues.length;
    console.log('getAverage() result:', average);
    return average;
  }

  getMaxValue(): number {
    console.log('getMaxValue() called with chartResponse:', this.chartResponse);
    if (!this.chartResponse?.data_points?.length) return 0;
    const max = Math.max(...this.chartResponse.data_points.map(p => p.amount));
    console.log('getMaxValue() result:', max);
    return max;
  }

  hasData(): boolean {
    const result = !!this.chartResponse;
    console.log('hasData() result:', result);
    return result;
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }
}
