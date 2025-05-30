import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BarcodeService } from '../../services/barcode.service';
import { BarcodeProduct, Item } from '../../interfaces/inventory.interface';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTabsModule
  ],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss'
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  barcode = '';
  isLoading = false;
  productInfo: BarcodeProduct | null = null;
  existingItems: Item[] = [];
  
  // Camera properties
  isCameraActive = false;
  stream: MediaStream | null = null;
  isScanning = false;
  scanInterval: any = null;
  cameraError: string | null = null;
  
  // Camera constraints
  cameraConstraints = {
    video: {
      facingMode: 'environment', // Rückkamera bevorzugen
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  constructor(
    private barcodeService: BarcodeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkCameraSupport();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private checkCameraSupport(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraError = 'Kamera wird von diesem Browser nicht unterstützt';
    }
  }

  async startCamera(): Promise<void> {
    try {
      this.cameraError = null;
      this.isLoading = true;
      
      this.stream = await navigator.mediaDevices.getUserMedia(this.cameraConstraints);
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
        this.isCameraActive = true;
        this.startBarcodeDetection();
      }
    } catch (error: any) {
      console.error('Fehler beim Starten der Kamera:', error);
      this.cameraError = this.getCameraErrorMessage(error);
      this.snackBar.open(this.cameraError, 'Schließen', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    this.isCameraActive = false;
    this.isScanning = false;
    this.cameraError = null;
  }

  private getCameraErrorMessage(error: any): string {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Kamera-Zugriff wurde verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.';
      case 'NotFoundError':
        return 'Keine Kamera gefunden. Stellen Sie sicher, dass eine Kamera angeschlossen ist.';
      case 'NotReadableError':
        return 'Kamera ist bereits in Verwendung oder nicht verfügbar.';
      case 'OverconstrainedError':
        return 'Kamera unterstützt die gewünschten Einstellungen nicht.';
      default:
        return `Kamera-Fehler: ${error.message || 'Unbekannter Fehler'}`;
    }
  }

  private startBarcodeDetection(): void {
    this.isScanning = true;
    
    // Einfache Barcode-Erkennung alle 500ms
    this.scanInterval = setInterval(() => {
      this.captureAndAnalyze();
    }, 500);
  }

  private captureAndAnalyze(): void {
    if (!this.videoElement || !this.canvasElement || !this.isCameraActive) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0) {
      return;
    }

    // Video-Frame auf Canvas zeichnen
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Hier würde normalerweise eine Barcode-Erkennungsbibliothek wie QuaggaJS verwendet
    // Für jetzt verwenden wir eine vereinfachte Simulation
    this.simulateBarcodeDetection(context, canvas);
  }

  private simulateBarcodeDetection(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Vereinfachte Barcode-Simulation - in echter Implementierung würde hier QuaggaJS oder ähnliches stehen
    // Für Demo-Zwecke erkennen wir einen Testbarcode
    
    // Diese Funktion würde in einer echten Implementierung durch eine Barcode-Library ersetzt
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simuliere Barcode-Erkennung (in echter App würde hier die Library arbeiten)
    if (Math.random() < 0.1) { // 10% Chance für Demo-Barcode
      const testBarcode = '4006381333931'; // Beispiel-Barcode
      this.onBarcodeDetected(testBarcode);
    }
  }

  private onBarcodeDetected(detectedBarcode: string): void {
    if (this.isLoading) return; // Verhindere mehrfache Detektionen
    
    this.stopCamera();
    this.barcode = detectedBarcode;
    this.snackBar.open(`Barcode erkannt: ${detectedBarcode}`, 'Schließen', { duration: 3000 });
    this.searchByBarcode();
  }

  searchByBarcode(): void {
    if (!this.barcode.trim()) {
      this.snackBar.open('Bitte geben Sie einen Barcode ein', 'Schließen', { duration: 3000 });
      return;
    }

    const cleanBarcode = this.barcodeService.formatBarcode(this.barcode);
    
    if (!this.barcodeService.isValidBarcode(cleanBarcode)) {
      this.snackBar.open('Ungültiger Barcode. Bitte geben Sie einen gültigen EAN oder UPC Code ein.', 'Schließen', { duration: 4000 });
      return;
    }

    this.isLoading = true;
    
    // Erst in vorhandenen Items suchen
    this.barcodeService.searchByBarcode(cleanBarcode).subscribe({
      next: (items) => {
        this.existingItems = items;
        // Dann Produktinformationen abrufen
        this.getProductInfo(cleanBarcode);
      },
      error: (error) => {
        console.error('Fehler bei der Barcode-Suche:', error);
        this.getProductInfo(cleanBarcode); // Trotzdem Produktinfo laden
      }
    });
  }

  private getProductInfo(barcode: string): void {
    this.barcodeService.getProductInfo(barcode).subscribe({
      next: (productInfo) => {
        this.productInfo = productInfo;
        this.isLoading = false;
        
        if (productInfo.found) {
          this.snackBar.open('Produktinformationen gefunden!', 'Schließen', { duration: 3000 });
        } else {
          this.snackBar.open('Keine Produktinformationen gefunden', 'Schließen', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Fehler beim Abrufen der Produktinformationen:', error);
        this.snackBar.open('Fehler beim Abrufen der Produktinformationen', 'Schließen', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  resetSearch(): void {
    this.barcode = '';
    this.productInfo = null;
    this.existingItems = [];
    this.stopCamera();
  }

  addToInventory(): void {
    if (this.productInfo?.found) {
      // Hier würde später die Navigation zum Item-Formular mit vorausgefüllten Daten erfolgen
      this.snackBar.open('Feature kommt bald: Automatisches Hinzufügen zum Inventar', 'Schließen', { duration: 4000 });
    }
  }
}
