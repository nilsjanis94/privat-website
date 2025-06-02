import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { Router } from '@angular/router';

import { BarcodeService } from '../../services/barcode.service';
import { InventoryService } from '../../services/inventory.service';
import { BarcodeProduct, Item, Category, ItemLocation } from '../../interfaces/inventory.interface';

// Native BarcodeDetector Interface
declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule
  ],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.scss'
})
export class BarcodeScannerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  barcode = '';
  isLoading = false;
  productInfo: BarcodeProduct | null = null;
  existingItems: Item[] = [];
  
  // Camera properties
  isCameraActive = false;
  isScanning = false;
  cameraError: string | null = null;
  cameraPermissionDenied = false;
  
  // Native Barcode Scanner
  private barcodeDetector: any;
  private stream: MediaStream | null = null;
  private scanInterval: any = null;
  
  // Form properties
  showAddForm = false;
  isSubmitting = false;
  addItemForm: FormGroup;
  categories: Category[] = [];
  locations = Object.values(ItemLocation);

  private isCameraStarting = false;
  private supportsBarcodeDetector = false;
  private supportsQuagga = false;
  public scanningActive = false;
  private lastProcessedBarcode: string | null = null;
  private isProcessingBarcode = false;
  
  // Confidence-basierte Erkennung - VERBESSERTE WERTE
  private barcodeDetectionHistory: { [key: string]: number } = {};
  private readonly REQUIRED_DETECTIONS = 5; // Erhöht von 3 auf 5 für mehr Stabilität
  private readonly DETECTION_TIMEOUT = 3000; // Verkürzt von 5000ms auf 3000ms
  private detectionTimeouts: { [key: string]: any } = {};
  private lastDetectionTime: { [key: string]: number } = {}; // Neue Property für Timing

  constructor(
    private barcodeService: BarcodeService,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.addItemForm = this.createItemForm();
    this.initializeBarcodeDetector();
  }

  ngOnInit(): void {
    this.checkCameraSupport();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.stopQuaggaScanning();
  }

  ngAfterViewInit() {
    this.waitForVideoElement();
    this.checkBarcodeSupport();
  }

  private createItemForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
      purchase_price: [0, [Validators.min(0)]],
      purchase_date: [new Date()],
      location: ['', Validators.required],
      expiry_date: [''],
      expected_lifetime_days: [null, [Validators.min(1)]],
      reminder_enabled: [false],
      reminder_days_before: [7, [Validators.min(1)]],
      barcode: [''],
      image_url: ['']
    });
  }

  private loadCategories(): void {
    this.inventoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Fehler beim Laden der Kategorien:', error);
        this.snackBar.open('Fehler beim Laden der Kategorien', 'Schließen', { duration: 3000 });
      }
    });
  }

  private checkCameraSupport(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraError = 'Kamera wird von diesem Browser nicht unterstützt';
    }
  }

  private initializeBarcodeDetector(): void {
    if ('BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'codabar', 'upc_a', 'upc_e']
        });
        console.log('Native BarcodeDetector initialisiert');
      } catch (error) {
        console.warn('BarcodeDetector nicht unterstützt, verwende Fallback:', error);
        this.barcodeDetector = null;
      }
    } else {
      console.warn('BarcodeDetector API nicht verfügbar, verwende manuelle Eingabe');
      this.barcodeDetector = null;
    }
  }

  private async waitForVideoElement(): Promise<void> {
    return new Promise((resolve) => {
      const checkVideoElement = () => {
        if (this.videoElement?.nativeElement) {
          console.log('✅ Video-Element gefunden');
          resolve();
        } else {
          console.log('⏳ Warte auf Video-Element...');
          setTimeout(checkVideoElement, 100);
        }
      };
      checkVideoElement();
    });
  }

  private async checkBarcodeSupport() {
    try {
      // Prüfe BarcodeDetector Support
      this.supportsBarcodeDetector = 'BarcodeDetector' in window;
      
      // Lade QuaggaJS dynamisch für Safari
      if (!this.supportsBarcodeDetector) {
        try {
          await this.loadQuaggaJS();
          this.supportsQuagga = typeof (window as any).Quagga !== 'undefined';
        } catch (error) {
          console.error('QuaggaJS konnte nicht geladen werden:', error);
          this.supportsQuagga = false;
        }
      }
      
      const supportInfo = [];
      if (this.supportsBarcodeDetector) supportInfo.push('BarcodeDetector (nativ)');
      if (this.supportsQuagga) supportInfo.push('QuaggaJS (Safari-kompatibel)');
      
      if (supportInfo.length === 0) {
        console.warn('⚠️ Keine Barcode-Scanning-Bibliotheken verfügbar - nur manuelle Eingabe möglich');
        this.snackBar.open('📱 Automatisches Scannen nicht verfügbar - verwende manuelle Eingabe', 'OK', {
          duration: 4000,
          panelClass: ['warning-snackbar']
        });
      } else {
        console.log(`✅ Barcode-Support verfügbar: ${supportInfo.join(', ')}`);
        
        // Safari-spezifische Info
        if (!this.supportsBarcodeDetector && this.supportsQuagga) {
          console.log('🍎 Safari/Firefox erkannt - verwende QuaggaJS für Barcode-Erkennung');
          this.snackBar.open('🍎 Safari-Modus: QuaggaJS Barcode-Scanner aktiviert', 'OK', {
            duration: 3000,
            panelClass: ['info-snackbar']
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Prüfen der Barcode-Unterstützung:', error);
    }
  }

  private loadQuaggaJS(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Prüfe ob bereits geladen
      if (typeof (window as any).Quagga !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ QuaggaJS erfolgreich geladen');
        resolve();
      };
      
      script.onerror = () => {
        console.error('❌ QuaggaJS konnte nicht geladen werden');
        reject(new Error('QuaggaJS loading failed'));
      };
      
      document.head.appendChild(script);
    });
  }

  async startCamera(): Promise<void> {
    if (this.isCameraActive || this.isCameraStarting) {
      console.log('Camera bereits aktiv oder startet gerade');
      return;
    }

    try {
      this.isCameraStarting = true;
      this.cameraError = null;
      this.cameraPermissionDenied = false;
      
      // Reset processing flags für neue Session - WICHTIG!
      console.log('🔄 [DEBUG] Reset processing flags in startCamera()');
      this.isProcessingBarcode = false;
      this.lastProcessedBarcode = null;
      this.clearDetectionHistory();
      console.log('🔄 [DEBUG] Processing flags nach Reset:', {
        isProcessingBarcode: this.isProcessingBarcode,
        lastProcessedBarcode: this.lastProcessedBarcode
      });
      
      console.log('Starte Kamera...');

      // Warte auf Video-Element im DOM
      await this.waitForVideoElement();
      
      if (!this.videoElement?.nativeElement) {
        throw new Error('Video-Element nicht gefunden');
      }

      // Stoppe vorherige Streams
      this.stopCamera();

      const constraints = {
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          facingMode: { ideal: 'environment' },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false
      };

      console.log('Fordere Kamera-Zugriff an...');
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const video = this.videoElement.nativeElement;
      
      // Video-Element konfigurieren
      video.srcObject = this.stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      
      // iOS-spezifische Eigenschaften
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('playsinline', 'true');
      video.setAttribute('preload', 'metadata');

      // Event Handler
      video.onloadedmetadata = () => {
        console.log('✅ Video-Metadaten geladen');
      };

      video.oncanplay = () => {
        console.log('✅ Video kann abgespielt werden');
      };

      // Safari iOS Click-Handler für manuelle Wiedergabe
      video.onclick = () => {
        if (video && video.paused) {
          console.log('🖱️ Manuelle Video-Wiedergabe (Safari iOS)');
          video.play().catch(console.error);
        }
      };

      // Video laden und warten
      await this.waitForVideoLoad();
      
      this.isCameraActive = true;
      this.cdr.detectChanges();
      
      console.log('🚀 [DEBUG] Starte Barcode-Scanning nach erfolgreichem Kamera-Start...');
      
      // Starte Scanning basierend auf verfügbaren Libraries
      await this.startBarcodeScanning();
      
      console.log('✅ Kamera erfolgreich gestartet');
      
    } catch (error: any) {
      console.error('Kamera-Fehler:', error);
      
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        this.cameraPermissionDenied = true;
        this.cameraError = 'Kamera-Berechtigung verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen.';
      } else if (error.name === 'NotFoundError') {
        this.cameraError = 'Keine Kamera gefunden. Bitte überprüfe, ob eine Kamera angeschlossen ist.';
      } else if (error.name === 'TimeoutError') {
        this.cameraError = 'Timeout beim Laden der Kamera. Bitte versuche es erneut.';
      } else {
        this.cameraError = `Kamera-Fehler: ${error.message || 'Unbekannter Fehler'}`;
      }
      
      this.isCameraActive = false;
      this.stopCamera();
    } finally {
      this.isCameraStarting = false;
      this.cdr.detectChanges();
    }
  }

  private async waitForVideoLoad(): Promise<void> {
    const video = this.videoElement?.nativeElement;
    if (!video) {
      throw new Error('Video-Element nicht verfügbar');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Video-Loading Timeout'));
      }, 5000);

      const onLoadedMetadata = () => {
        console.log('✅ Video-Metadaten geladen');
        clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        resolve();
      };

      const onError = (error: any) => {
        console.error('Video-Fehler:', error);
        clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        reject(error);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);

      // Falls bereits geladen
      if (video.readyState >= 1) {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  private async startBarcodeScanning() {
    if (this.scanningActive) {
      console.log('🔄 [DEBUG] Scanning bereits aktiv - beende startBarcodeScanning()');
      return;
    }

    console.log('🔍 [DEBUG] startBarcodeScanning() GESTARTET');
    console.log('🔍 [DEBUG] Support-Status:', {
      supportsBarcodeDetector: this.supportsBarcodeDetector,
      supportsQuagga: this.supportsQuagga
    });

    try {
      if (this.supportsBarcodeDetector) {
        console.log('🔍 Starte BarcodeDetector-Scanning...');
        await this.startBarcodeDetectorScanning();
      } else if (this.supportsQuagga) {
        console.log('🔍 Starte QuaggaJS-Scanning...');
        await this.startQuaggaScanning();
      } else {
        console.warn('⚠️ Kein automatisches Scanning verfügbar - nur manuelle Eingabe');
        this.snackBar.open('📱 Kamera gestartet - manuelle Eingabe verwenden', 'OK', {
          duration: 3000,
          panelClass: ['info-snackbar']
        });
      }
    } catch (error) {
      console.error('Fehler beim Starten des Barcode-Scannings:', error);
    }
    
    console.log('🔍 [DEBUG] startBarcodeScanning() BEENDET - scanningActive:', this.scanningActive);
  }

  private async startBarcodeDetectorScanning() {
    if (!this.supportsBarcodeDetector || !this.videoElement?.nativeElement) {
      console.log('🚫 [DEBUG] BarcodeDetector kann nicht gestartet werden:', {
        supportsBarcodeDetector: this.supportsBarcodeDetector,
        hasVideoElement: !!this.videoElement?.nativeElement
      });
      return;
    }

    try {
      console.log('🚀 [DEBUG] Starte BarcodeDetector-Scanning...');
      this.scanningActive = true;
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code']
      });

      console.log('✅ [DEBUG] BarcodeDetector erstellt, starte Interval...');
      
      // Langsameres Scanning für bessere Stabilität
      this.scanInterval = setInterval(async () => {
        if (!this.isCameraActive || !this.videoElement?.nativeElement || this.videoElement.nativeElement.videoWidth === 0) {
          console.log('⏸️ [DEBUG] BarcodeDetector Scan übersprungen - Video nicht bereit');
          return;
        }

        try {
          const barcodes = await barcodeDetector.detect(this.videoElement.nativeElement);
          
          if (barcodes.length > 0) {
            console.log('🎯 [DEBUG] BarcodeDetector - Barcodes erkannt:', barcodes.length);
            const barcode = barcodes[0];
            console.log('📊 [DEBUG] Erkannter Barcode:', barcode.rawValue);
            
            // Validiere Barcode-Qualität
            if (this.isValidBarcode(barcode.rawValue)) {
              console.log('✅ [DEBUG] Barcode gültig - rufe processDetectedBarcode auf');
              this.processDetectedBarcode(barcode.rawValue, 'BarcodeDetector');
            } else {
              console.log(`❌ Ungültiger Barcode ignoriert:`, barcode.rawValue);
            }
          } else {
            // Weniger häufiges Logging für "kein Barcode"
            if (Math.random() < 0.1) { // 10% Chance für Log
              console.log('🔍 [DEBUG] BarcodeDetector - Kein Barcode erkannt');
            }
          }
        } catch (error) {
          console.error('BarcodeDetector Scan-Fehler:', error);
        }
      }, 1000); // Verlangsamt von 500ms auf 1000ms

      console.log('⏰ [DEBUG] BarcodeDetector Interval gesetzt, Timeout in 30s');

      setTimeout(() => {
        if (this.scanInterval) {
          console.log('⏰ [DEBUG] BarcodeDetector Timeout erreicht - stoppe Scanning');
          clearInterval(this.scanInterval);
          this.scanInterval = null;
          this.scanningActive = false;
          this.clearDetectionHistory();
        }
      }, 30000);

    } catch (error) {
      console.error('Fehler beim Starten des BarcodeDetector-Scannings:', error);
      this.scanningActive = false;
    }
  }

  private isValidBarcode(barcode: string): boolean {
    // Verbesserte Barcode-Validierung
    if (!barcode || typeof barcode !== 'string') {
      return false;
    }
    
    // Entferne Whitespace
    barcode = barcode.trim();
    
    // Mindest- und Maximallänge
    if (barcode.length < 8 || barcode.length > 18) {
      return false;
    }
    
    // EAN/UPC Codes (nur Zahlen)
    if (/^\d{8,13}$/.test(barcode)) {
      return true;
    }
    
    // Code 128/39 (Alphanumerisch mit begrenzten Sonderzeichen)
    if (/^[A-Za-z0-9\-\.\_]{8,18}$/.test(barcode)) {
      return true;
    }
    
    // Filtere offensichtlich falsche Codes aus
    if (barcode.includes('undefined') || 
        barcode.includes('null') || 
        barcode.includes('NaN') ||
        barcode.length < 8) {
      return false;
    }
    
    return false;
  }

  private async startQuaggaScanning() {
    if (!this.supportsQuagga || !this.videoElement?.nativeElement) {
      console.log('🚫 [DEBUG] QuaggaJS kann nicht gestartet werden:', {
        supportsQuagga: this.supportsQuagga,
        hasVideoElement: !!this.videoElement?.nativeElement
      });
      return;
    }

    try {
      console.log('🚀 [DEBUG] Starte QuaggaJS-Scanning...');
      this.scanningActive = true;
      const Quagga = (window as any).Quagga;
      
      console.log('⚙️ [DEBUG] Konfiguriere QuaggaJS...');
      
      // QuaggaJS konfigurieren - VERBESSERTE KONFIGURATION
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: this.videoElement.nativeElement,
          constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: "environment",
            frameRate: { ideal: 15, max: 30 } // Reduziert für stabilere Erkennung
          }
        },
        locator: {
          patchSize: "large", // Erhöht von "medium" auf "large"
          halfSample: false,  // Disabled für bessere Qualität
          debug: {
            showCanvas: false,
            showPatches: false,
            showFoundPatches: false,
            showSkeleton: false,
            showLabels: false,
            showPatchLabels: false,
            showRemainingPatchLabels: false,
            boxFromPatches: {
              showTransformed: false,
              showTransformedBox: false,
              showBB: false
            }
          }
        },
        numOfWorkers: 2,
        frequency: 10, // Reduziert von Standard für stabilere Erkennung
        decoder: {
          readers: [
            "ean_reader",        // EAN-13/8
            "ean_8_reader",      // EAN-8 spezifisch
            "code_128_reader"    // Code 128 (entferne andere für mehr Stabilität)
          ],
          debug: {
            drawBoundingBox: false,
            showFrequency: false,
            drawScanline: false,
            drawImageData: false
          }
        },
        locate: true,
        multiple: false  // Nur einen Barcode gleichzeitig erkennen
      }, (err: any) => {
        if (err) {
          console.error('❌ [DEBUG] QuaggaJS Initialisierung fehlgeschlagen:', err);
          this.scanningActive = false;
          return;
        }
        
        console.log('✅ [DEBUG] QuaggaJS erfolgreich initialisiert, starte Scanner...');
        Quagga.start();
      });

      // Barcode-Detection Event
      Quagga.onDetected((data: any) => {
        console.log('🎯 [DEBUG] QuaggaJS - Barcode erkannt!');
        const code = data.codeResult.code;
        console.log('📊 [DEBUG] QuaggaJS - Erkannter Barcode:', code);
        
        // Validiere Barcode-Qualität
        if (this.isValidBarcode(code)) {
          console.log('✅ [DEBUG] QuaggaJS - Barcode gültig, rufe processDetectedBarcode auf');
          this.processDetectedBarcode(code, 'QuaggaJS');
        } else {
          console.log(`❌ Ungültiger Barcode ignoriert (QuaggaJS):`, code);
        }
      });

      console.log('👂 [DEBUG] QuaggaJS onDetected Event-Listener registriert');

    } catch (error) {
      console.error('Fehler beim Starten des QuaggaJS-Scannings:', error);
      this.scanningActive = false;
    }
  }

  private onScanComplete(): void {
    console.log('🎯 Barcode-Scan abgeschlossen');
    
    // Stoppe alle Scanning-Aktivitäten
    this.scanningActive = false;
    
    // Stoppe BarcodeDetector-Interval
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    
    // Stoppe QuaggaJS
    this.stopQuaggaScanning();
    
    // Führe Barcode-Suche aus
    const barcodeValue = this.addItemForm.get('barcode')?.value;
    console.log('📊 Debug - Barcode-Wert aus Form:', barcodeValue);
    console.log('📊 Debug - Form-Status:', this.addItemForm.valid);
    console.log('📊 Debug - Processing flags:', {
      isProcessingBarcode: this.isProcessingBarcode,
      lastProcessedBarcode: this.lastProcessedBarcode
    });
    
    if (barcodeValue && barcodeValue.trim()) {
      this.barcode = barcodeValue.trim();
      console.log('🔍 Starte Produktsuche für Barcode:', this.barcode);
      
      // Zeige kurze Erfolgsmeldung
      this.snackBar.open('📱 Barcode erkannt! Suche Produktinformationen...', '', { 
        duration: 2000,
        panelClass: ['success-snackbar']
      });
      
      // Trigger Change Detection vor API-Aufruf
      this.cdr.detectChanges();
      
      // Starte Produktsuche mit Timeout
      setTimeout(() => {
        console.log('🔍 Rufe getProductInfo auf...');
        this.getProductInfo(this.barcode);
      }, 100);
      
    } else {
      console.error('❌ Kein gültiger Barcode-Wert gefunden');
      console.error('📊 Debug - Form-Werte:', this.addItemForm.value);
      
      this.snackBar.open('Fehler: Kein gültiger Barcode erkannt', 'Schließen', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      
      // Reset processing flags bei Fehler
      this.isProcessingBarcode = false;
      
      // Stoppe Kamera auch bei Fehler
      this.stopCamera();
    }
  }

  private processDetectedBarcode(barcodeValue: string, source: string): void {
    console.log(`🔍 [DEBUG] processDetectedBarcode GESTARTET von ${source}:`, barcodeValue);
    console.log(`🔍 [DEBUG] processDetectedBarcode - isProcessingBarcode:`, this.isProcessingBarcode);
    console.log(`🔍 [DEBUG] processDetectedBarcode - scanningActive:`, this.scanningActive);
    
    // Prüfe ob bereits verarbeitet wird
    if (this.isProcessingBarcode) {
      console.log('🔄 [DEBUG] Barcode wird bereits verarbeitet, ignoriere... - BEENDE METHODE');
      return;
    }
    
    // NEUE: Minimale Zeitspanne zwischen Erkennungen (Anti-Spam)
    const now = Date.now();
    const MIN_DETECTION_INTERVAL = 200; // 200ms zwischen Erkennungen
    
    if (this.lastDetectionTime[barcodeValue] && 
        (now - this.lastDetectionTime[barcodeValue]) < MIN_DETECTION_INTERVAL) {
      console.log(`⏸️ [DEBUG] Zu schnelle Wiederholung für ${barcodeValue} - ignoriere`);
      return;
    }
    
    this.lastDetectionTime[barcodeValue] = now;
    
    // Initialisiere Erkennungs-Counter falls nicht vorhanden
    if (!this.barcodeDetectionHistory[barcodeValue]) {
      this.barcodeDetectionHistory[barcodeValue] = 0;
      console.log(`📊 [DEBUG] Neuer Barcode ${barcodeValue} - Counter initialisiert`);
    }
    
    // Erhöhe Counter
    this.barcodeDetectionHistory[barcodeValue]++;
    console.log(`📊 [DEBUG] Barcode ${barcodeValue} erkannt: ${this.barcodeDetectionHistory[barcodeValue]}/${this.REQUIRED_DETECTIONS}`);
    
    // Setze Timeout für diese Erkennung
    if (this.detectionTimeouts[barcodeValue]) {
      clearTimeout(this.detectionTimeouts[barcodeValue]);
      console.log(`⏰ [DEBUG] Timeout für Barcode ${barcodeValue} zurückgesetzt`);
    }
    
    this.detectionTimeouts[barcodeValue] = setTimeout(() => {
      console.log(`⏰ [DEBUG] Timeout für Barcode ${barcodeValue} - Reset Counter`);
      delete this.barcodeDetectionHistory[barcodeValue];
      delete this.detectionTimeouts[barcodeValue];
      delete this.lastDetectionTime[barcodeValue]; // Cleanup timing
    }, this.DETECTION_TIMEOUT);
    
    // Prüfe ob genug Erkennungen vorhanden sind
    if (this.barcodeDetectionHistory[barcodeValue] >= this.REQUIRED_DETECTIONS) {
      console.log(`✅ [DEBUG] Barcode ${barcodeValue} bestätigt nach ${this.barcodeDetectionHistory[barcodeValue]} Erkennungen`);
      console.log(`🔒 [DEBUG] Setze isProcessingBarcode = true`);
      
      // Markiere als verarbeitet
      this.isProcessingBarcode = true;
      this.lastProcessedBarcode = barcodeValue;
      
      // Stoppe das Scanning
      this.scanningActive = false;
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
        console.log(`🛑 [DEBUG] scanInterval gestoppt`);
      }
      this.stopQuaggaScanning();
      
      // Reset Detection History
      this.clearDetectionHistory();
      console.log(`🧹 [DEBUG] Detection History geleert`);
      
      // Setze Barcode in Form und starte Verarbeitung
      console.log(`📝 [DEBUG] Setze Barcode in Form: ${barcodeValue}`);
      this.addItemForm.patchValue({ barcode: barcodeValue });
      console.log(`📝 [DEBUG] Form nach patchValue:`, this.addItemForm.value);
      
      console.log(`🚀 [DEBUG] Rufe onConfirmedScanComplete() auf...`);
      this.onConfirmedScanComplete();
      console.log(`✅ [DEBUG] onConfirmedScanComplete() Aufruf beendet`);
    } else {
      console.log(`⏳ [DEBUG] Barcode ${barcodeValue} benötigt noch ${this.REQUIRED_DETECTIONS - this.barcodeDetectionHistory[barcodeValue]} weitere Erkennungen`);
    }
    
    console.log(`🏁 [DEBUG] processDetectedBarcode BEENDET`);
  }
  
  private clearDetectionHistory(): void {
    // Clear alle Timeouts
    Object.values(this.detectionTimeouts).forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    
    // Reset History und Timing
    this.barcodeDetectionHistory = {};
    this.detectionTimeouts = {};
    this.lastDetectionTime = {}; // Neue Cleanup für Timing
    
    console.log('🧹 [DEBUG] Detection History, Timeouts und Timing komplett geleert');
  }

  private onConfirmedScanComplete(): void {
    console.log('🎯 [DEBUG] onConfirmedScanComplete() GESTARTET');
    
    // Stoppe SOFORT alle Scanning-Aktivitäten und Kamera
    console.log('🛑 [DEBUG] Stoppe Kamera SOFORT nach Barcode-Erkennung');
    this.stopCamera();
    
    // Force UI update vor dem API-Aufruf
    this.cdr.detectChanges();
    
    // Führe Barcode-Suche aus
    const barcodeValue = this.addItemForm.get('barcode')?.value;
    console.log('📊 [DEBUG] Barcode-Wert aus Form:', barcodeValue);
    
    if (barcodeValue && barcodeValue.trim()) {
      this.barcode = barcodeValue.trim();
      console.log('🔍 [DEBUG] Starte Produktsuche für bestätigten Barcode:', this.barcode);
      
      // Zeige kurze Erfolgsmeldung
      this.snackBar.open('📱 Barcode bestätigt! Suche Produktinformationen...', '', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      // Trigger Change Detection vor API-Aufruf
      this.cdr.detectChanges();
      
      console.log('🚀 [DEBUG] Rufe jetzt getProductInfo() auf...');
      
      // Starte Produktsuche direkt (ohne Timeout)
      this.getProductInfo(this.barcode);
      console.log('✅ [DEBUG] getProductInfo() Aufruf abgeschlossen');
      
    } else {
      console.error('❌ [DEBUG] Kein gültiger Barcode-Wert nach Bestätigung gefunden');
      
      this.snackBar.open('Fehler: Kein gültiger Barcode erkannt', 'Schließen', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      
      // Reset processing flags bei Fehler
      this.isProcessingBarcode = false;
      this.clearDetectionHistory();
    }
    
    console.log('🏁 [DEBUG] onConfirmedScanComplete() BEENDET');
  }

  private stopQuaggaScanning() {
    try {
      const Quagga = (window as any).Quagga;
      if (this.supportsQuagga && typeof Quagga !== 'undefined' && this.scanningActive) {
        // Prüfe ob QuaggaJS tatsächlich läuft
        if (Quagga.CameraAccess && Quagga.CameraAccess.isActive()) {
          Quagga.stop();
          console.log('🛑 QuaggaJS Scanning gestoppt');
        }
        
        // Events entfernen
        try {
          Quagga.offDetected();
        } catch (e) {
          // Ignore - Event war möglicherweise nicht registriert
        }
      }
    } catch (error: any) {
      // QuaggaJS-Fehler ignorieren da sie meist harmlos sind
      console.warn('QuaggaJS Stop-Warnung (kann ignoriert werden):', error?.message || error);
    }
    this.scanningActive = false;
  }

  stopCamera(): void {
    try {
      console.log('🛑 Stoppe Kamera...');
      
      // Stoppe alle Scanning-Aktivitäten ZUERST
      this.scanningActive = false;
      
      // Stoppe BarcodeDetector-Interval
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
        console.log('🛑 BarcodeDetector Interval gestoppt');
      }
      
      // Stoppe QuaggaJS VOLLSTÄNDIG
      this.stopQuaggaScanning();
      
      // ZUSÄTZLICH: Force-Stop QuaggaJS falls noch aktiv
      try {
        const Quagga = (window as any).Quagga;
        if (typeof Quagga !== 'undefined') {
          console.log('🛑 [DEBUG] Force-Stoppe QuaggaJS...');
          
          // Stoppe alle QuaggaJS Aktivitäten
          if (Quagga.CameraAccess && typeof Quagga.CameraAccess.release === 'function') {
            Quagga.CameraAccess.release();
            console.log('🛑 [DEBUG] QuaggaJS CameraAccess released');
          }
          
          if (typeof Quagga.stop === 'function') {
            Quagga.stop();
            console.log('🛑 [DEBUG] QuaggaJS stopped');
          }
          
          // Entferne alle Event-Listener
          if (typeof Quagga.offDetected === 'function') {
            Quagga.offDetected();
            console.log('🛑 [DEBUG] QuaggaJS Event-Listener entfernt');
          }
        }
      } catch (quaggaError) {
        console.warn('⚠️ QuaggaJS Force-Stop Warnung (kann ignoriert werden):', quaggaError);
      }
      
      // Stoppe Video Stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log('🛑 Video Track gestoppt:', track.kind);
          }
        });
        this.stream = null;
        console.log('🛑 MediaStream auf null gesetzt');
      }

      // Reset Video Element KOMPLETT
      if (this.videoElement?.nativeElement) {
        const video = this.videoElement.nativeElement;
        
        // Pausiere Video
        video.pause();
        
        // Entferne srcObject
        video.srcObject = null;
        
        // Reset src
        video.src = '';
        
        // Force reload
        video.load();
        
        // Entferne alle Event-Listener
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onclick = null;
        
        console.log('🛑 Video-Element vollständig zurückgesetzt');
      }

      // Reset alle Flags
      this.isCameraActive = false;
      this.isScanning = false;
      this.scanningActive = false;
      
      // Force UI Update
      this.cdr.detectChanges();
      
      console.log('✅ Kamera erfolgreich gestoppt');
      
    } catch (error) {
      console.error('Fehler beim Stoppen der Kamera:', error);
    }
  }

  searchByBarcode(): void {
    if (!this.barcode.trim()) {
      this.snackBar.open('Bitte geben Sie einen Barcode ein', 'Schließen', { duration: 3000 });
      return;
    }

    // Stoppe Kamera falls aktiv (für manuelle Suche)
    if (this.isCameraActive) {
      this.stopCamera();
      console.log('📱 Kamera gestoppt für manuelle Barcode-Suche');
    }

    this.getProductInfo(this.barcode);
  }

  private getProductInfo(barcode: string): void {
    console.log('🔍 [DEBUG] getProductInfo GESTARTET mit Barcode:', barcode);
    console.log('🔍 [DEBUG] getProductInfo - Component State beim Start:', this.debugState);
    console.log('🔍 [DEBUG] getProductInfo - isProcessingBarcode:', this.isProcessingBarcode);
    console.log('🔍 [DEBUG] getProductInfo - lastProcessedBarcode:', this.lastProcessedBarcode);
    
    console.log('🚀 [DEBUG] Starte API-Aufrufe für Barcode:', barcode);
    
    // Reset UI state explizit
    this.isLoading = true;
    this.productInfo = null;
    this.existingItems = [];
    this.showAddForm = false;
    
    console.log('🔄 [DEBUG] UI State nach Reset (vor stopCamera):', {
      isLoading: this.isLoading,
      productInfo: this.productInfo,
      existingItems: this.existingItems.length,
      showAddForm: this.showAddForm
    });
    
    // Stoppe Kamera sofort bei API-Start
    this.stopCamera();
    console.log('🛑 [DEBUG] Kamera gestoppt bei API-Start');
    
    // Force UI update
    this.cdr.detectChanges();
    console.log('🔄 [DEBUG] UI State nach Reset und stopCamera:', {
      isLoading: this.isLoading,
      productInfo: this.productInfo,
      existingItems: this.existingItems.length,
      showAddForm: this.showAddForm,
      isCameraActive: this.isCameraActive
    });

    // Suche in der Inventory nach existierenden Items
    console.log('📡 [DEBUG] Suche in Inventory...');
    this.inventoryService.searchByBarcode(barcode).subscribe({
      next: (items: Item[]) => {
        console.log('✅ Inventory-Suche erfolgreich. Gefundene Items:', items.length, items);
        
        this.existingItems = items;
        this.isLoading = false;
        
        // Explizite UI-Updates
        this.cdr.detectChanges();
        
        console.log('🔄 UI State nach Inventory-Suche:', {
          isLoading: this.isLoading,
          existingItems: this.existingItems.length,
          showAddForm: this.showAddForm,
          isCameraActive: this.isCameraActive
        });
        
        if (items.length === 0) {
          console.log('📡 Keine existierenden Items - suche in Barcode-API...');
          
          // Reset für Barcode-API-Suche
          this.isLoading = true;
          this.cdr.detectChanges();
          
          // Suche in der Barcode-API
          this.barcodeService.getProductInfo(barcode).subscribe({
            next: (product) => {
              console.log('✅ Barcode-API erfolgreich. Produkt gefunden:', product);
              
              this.isLoading = false;
              this.productInfo = product;
              this.showAddForm = true; // Immer anzeigen, auch bei "nicht gefunden"
              
              // Explizite UI-Updates
              this.cdr.detectChanges();
              
              console.log('🔄 UI State nach Barcode-API (Erfolg):', {
                isLoading: this.isLoading,
                productInfo: !!this.productInfo,
                showAddForm: this.showAddForm,
                isCameraActive: this.isCameraActive
              });
              
              if (this.productInfo && this.productInfo.found) {
                this.prefillFormWithProductInfo();
                console.log('✅ Produktinformationen gefunden - Form vorausgefüllt');
              } else {
                // Auch bei "nicht gefunden" Form vorbereiten
                this.addItemForm.patchValue({ barcode: barcode });
                console.log('⚠️ Produkt nicht gefunden aber Form für manuelle Eingabe bereit');
              }
              
              // Reset processing flags
              this.isProcessingBarcode = false;
              this.lastProcessedBarcode = null;
              this.clearDetectionHistory();
              
            },
            error: (error: any) => {
              console.error('❌ Fehler bei Produktsuche:', error);
              
              this.isLoading = false;
              this.showAddForm = true; // Auch bei API-Fehler anzeigen
              this.addItemForm.patchValue({ barcode: barcode });
              
              // Explizite UI-Updates
              this.cdr.detectChanges();
              
              console.log('🔄 UI State nach Barcode-API (Fehler):', {
                isLoading: this.isLoading,
                productInfo: !!this.productInfo,
                showAddForm: this.showAddForm,
                isCameraActive: this.isCameraActive
              });
              
              console.log('⚠️ API-Fehler - Form für manuelle Eingabe bereit');
              
              // Reset processing flags
              this.isProcessingBarcode = false;
              this.lastProcessedBarcode = null;
              this.clearDetectionHistory();
            }
          });
        } else {
          console.log(`✅ ${items.length} existierende Items gefunden - UI aktualisiert`);
          
          // Reset processing flags
          this.isProcessingBarcode = false;
          this.lastProcessedBarcode = null;
          this.clearDetectionHistory();
        }
      },
      error: (error: any) => {
        console.error('❌ Fehler bei der Inventory-Suche:', error);
        
        this.isLoading = false;
        this.showAddForm = true; // Auch bei Inventory-Fehler anzeigen
        this.addItemForm.patchValue({ barcode: barcode });
        
        // Explizite UI-Updates
        this.cdr.detectChanges();
        
        console.log('🔄 UI State nach Inventory-Fehler:', {
          isLoading: this.isLoading,
          productInfo: !!this.productInfo,
          showAddForm: this.showAddForm,
          isCameraActive: this.isCameraActive
        });
        
        this.snackBar.open('Fehler bei der Suche - Manuelle Eingabe möglich', 'Schließen', { duration: 3000 });
        
        // Reset processing flags
        this.isProcessingBarcode = false;
        this.lastProcessedBarcode = null;
        this.clearDetectionHistory();
      }
    });
  }

  resetSearch(): void {
    this.barcode = '';
    this.productInfo = null;
    this.existingItems = [];
    this.showAddForm = false;
    this.isLoading = false;
    
    // Reset processing flags
    this.isProcessingBarcode = false;
    this.lastProcessedBarcode = null;
    this.clearDetectionHistory();
    
    this.resetForm();
  }

  addToInventory(): void {
    this.showAddForm = true;
    this.prefillFormWithProductInfo();
  }

  addManualEntry(): void {
    this.showAddForm = true;
    this.addItemForm.patchValue({ 
      barcode: this.barcode,
      name: '',
      description: '',
      category: '',
      location: ''
    });
  }

  private prefillFormWithProductInfo(): void {
    if (!this.productInfo) return;

    const category = this.findMatchingCategory(this.productInfo.category);
    
    this.addItemForm.patchValue({
      name: this.productInfo.name || '',
      description: this.generateDescription(),
      category: category?.name || '',
      barcode: this.barcode,
      image_url: this.productInfo.image_url || ''
    });
  }

  private generateDescription(): string {
    if (!this.productInfo) return '';
    
    const parts = [];
    if (this.productInfo.brand) parts.push(this.productInfo.brand);
    if (this.productInfo.description) parts.push(this.productInfo.description);
    if (this.productInfo.ingredients) {
      const ingredients = this.productInfo.ingredients.substring(0, 100);
      parts.push(`Zutaten: ${ingredients}${this.productInfo.ingredients.length > 100 ? '...' : ''}`);
    }
    
    return parts.join(' | ');
  }

  private findMatchingCategory(productCategory?: string): Category | null {
    if (!productCategory || this.categories.length === 0) return null;
    
    const searchTerm = productCategory.toLowerCase();
    
    // Exakte Übereinstimmung
    let match = this.categories.find(cat => cat.name.toLowerCase() === searchTerm);
    if (match) return match;
    
    // Teilweise Übereinstimmung
    match = this.categories.find(cat => 
      cat.name.toLowerCase().includes(searchTerm) || 
      searchTerm.includes(cat.name.toLowerCase())
    );
    
    return match || null;
  }

  submitItem(): void {
    if (this.addItemForm.invalid) {
      this.markFormGroupTouched();
      this.snackBar.open('Bitte füllen Sie alle Pflichtfelder aus', 'Schließen', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const formData = this.addItemForm.value;
    
    // Datum formatieren
    if (formData.expiry_date) {
      formData.expiry_date = this.formatDate(formData.expiry_date);
    }
    if (formData.purchase_date) {
      formData.purchase_date = this.formatDate(formData.purchase_date);
    }

    this.inventoryService.addItem(formData).subscribe({
      next: (response: any) => {
        this.snackBar.open('Artikel erfolgreich hinzugefügt', 'Schließen', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.resetSearch();
        this.goToInventory();
      },
      error: (error: any) => {
        console.error('Fehler beim Hinzufügen:', error);
        this.snackBar.open('Fehler beim Hinzufügen des Artikels', 'Schließen', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addItemForm.controls).forEach(key => {
      const control = this.addItemForm.get(key);
      control?.markAsTouched();
    });
  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.addItemForm.reset({
      quantity: 1,
      purchase_price: 0,
      purchase_date: new Date(),
      reminder_enabled: false,
      reminder_days_before: 7
    });
  }

  goToInventory(): void {
    this.router.navigate(['/inventory']);
  }

  getLocationDisplayName(location: string): string {
    const locationMap: { [key: string]: string } = {
      [ItemLocation.KUECHE]: 'Küche',
      [ItemLocation.SCHLAFZIMMER]: 'Schlafzimmer', 
      [ItemLocation.WOHNZIMMER]: 'Wohnzimmer',
      [ItemLocation.BAD]: 'Badezimmer',
      [ItemLocation.BUERO]: 'Büro',
      [ItemLocation.GARAGE]: 'Garage',
      [ItemLocation.SONSTIGES]: 'Sonstiges'
    };
    return locationMap[location] || location;
  }

  get formControls() {
    return this.addItemForm.controls;
  }

  // Debug-Hilfsmethoden für UI
  get debugState() {
    return {
      isLoading: this.isLoading,
      isCameraActive: this.isCameraActive,
      scanningActive: this.scanningActive,
      productInfo: !!this.productInfo,
      existingItemsCount: this.existingItems.length,
      showAddForm: this.showAddForm,
      barcode: this.barcode
    };
  }

  onVideoLoaded(): void {
    console.log('📹 Video loaded event triggered');
  }

  onVideoCanPlay(): void {
    console.log('▶️ Video can play event triggered');
  }

  onVideoClick(): void {
    const video = this.videoElement?.nativeElement;
    if (video && video.paused) {
      console.log('🖱️ Video clicked - attempting manual play');
      video.play().catch(console.error);
    }
  }
} 