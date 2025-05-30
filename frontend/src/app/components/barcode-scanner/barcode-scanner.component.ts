import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { BarcodeService } from '../../services/barcode.service';
import { InventoryService } from '../../services/inventory.service';
import { BarcodeProduct, Item, Category, ItemLocation } from '../../interfaces/inventory.interface';

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
    MatSnackBarModule,
    MatProgressBarModule,
    MatTabsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatStepperModule
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
  
  // Form properties
  showAddForm = false;
  isSubmitting = false;
  addItemForm: FormGroup;
  categories: Category[] = [];
  locations = Object.values(ItemLocation);
  
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
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.addItemForm = this.createItemForm();
  }

  ngOnInit(): void {
    this.checkCameraSupport();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private createItemForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['', Validators.required],
      purchase_price: [0, [Validators.min(0)]],
      purchase_date: [new Date()],
      location: ['', Validators.required],
      expiry_date: [''],
      expected_lifetime_days: [null, [Validators.min(1)]],
      reminder_enabled: [false],
      reminder_days_before: [7, [Validators.min(1)]],
      barcode: ['']
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
      this.showAddForm = true;
      this.prefillFormWithProductInfo();
    } else {
      this.snackBar.open('Keine Produktinformationen zum Hinzufügen verfügbar', 'Schließen', { duration: 3000 });
    }
  }

  private prefillFormWithProductInfo(): void {
    if (this.productInfo?.found) {
      // Formular mit Produktdaten vorausfüllen
      this.addItemForm.patchValue({
        name: this.productInfo.name || '',
        description: this.generateDescription(),
        barcode: this.productInfo.barcode || this.barcode,
        purchase_date: new Date()
      });

      // Kategorie automatisch zuweisen basierend auf Produktkategorie
      const matchedCategory = this.findMatchingCategory(this.productInfo.category);
      if (matchedCategory) {
        this.addItemForm.patchValue({ category: matchedCategory.id });
      }
    }
  }

  private generateDescription(): string {
    if (!this.productInfo?.found) return '';
    
    const parts = [];
    
    if (this.productInfo.brand) {
      parts.push(`Marke: ${this.productInfo.brand}`);
    }
    
    if (this.productInfo.category) {
      parts.push(`Kategorie: ${this.productInfo.category}`);
    }

    // Zutaten nur wenn noch Platz ist und stark gekürzt
    if (this.productInfo.ingredients) {
      const remainingLength = 200 - parts.join(' | ').length - 12; // -12 für " | Zutaten: "
      if (remainingLength > 20) {
        const shortIngredients = this.productInfo.ingredients.substring(0, Math.min(remainingLength - 3, 80));
        parts.push(`Zutaten: ${shortIngredients}${shortIngredients.length < this.productInfo.ingredients.length ? '...' : ''}`);
      }
    }
    
    const description = parts.join(' | ');
    
    // Sicherheitscheck: Auf 200 Zeichen begrenzen
    if (description.length > 200) {
      return description.substring(0, 197) + '...';
    }
    
    return description;
  }

  private findMatchingCategory(productCategory?: string): Category | null {
    if (!productCategory || this.categories.length === 0) return null;
    
    const categoryLower = productCategory.toLowerCase();
    
    // Direkte Übereinstimmung
    let match = this.categories.find(cat => 
      cat.name.toLowerCase().includes(categoryLower) || 
      categoryLower.includes(cat.name.toLowerCase())
    );
    
    if (match) return match;
    
    // Kategorien-Mapping für bessere Zuordnung
    const categoryMappings: { [key: string]: string[] } = {
      'lebensmittel': ['food', 'getränke', 'snacks', 'beverages', 'dairy', 'meat', 'frozen'],
      'elektronik': ['electronics', 'computer', 'phone', 'tech'],
      'kosmetik': ['beauty', 'cosmetics', 'care', 'hygiene'],
      'haushalt': ['household', 'cleaning', 'kitchen', 'home'],
      'kleidung': ['clothing', 'fashion', 'shoes', 'accessories']
    };
    
    for (const [germanCategory, englishTerms] of Object.entries(categoryMappings)) {
      if (englishTerms.some(term => categoryLower.includes(term))) {
        match = this.categories.find(cat => cat.name.toLowerCase().includes(germanCategory));
        if (match) return match;
      }
    }
    
    // Fallback: erste Kategorie oder null
    return this.categories.length > 0 ? this.categories[0] : null;
  }

  submitItem(): void {
    if (this.addItemForm.valid) {
      this.isSubmitting = true;
      
      const formData = { ...this.addItemForm.value };
      
      // Konsole-Log für Debugging
      console.log('Form Data before processing:', formData);
      
      // Datum formatierung
      if (formData.purchase_date) {
        formData.purchase_date = this.formatDate(formData.purchase_date);
      }
      
      if (formData.expiry_date) {
        formData.expiry_date = this.formatDate(formData.expiry_date);
      }
      
      // Numerische Werte korrekt formatieren
      if (formData.purchase_price !== null && formData.purchase_price !== undefined && formData.purchase_price !== '') {
        formData.purchase_price = parseFloat(formData.purchase_price);
        if (isNaN(formData.purchase_price)) {
          formData.purchase_price = null;
        }
      } else {
        formData.purchase_price = null;
      }
      
      if (formData.expected_lifetime_days !== null && formData.expected_lifetime_days !== undefined && formData.expected_lifetime_days !== '') {
        formData.expected_lifetime_days = parseInt(formData.expected_lifetime_days);
        if (isNaN(formData.expected_lifetime_days)) {
          formData.expected_lifetime_days = null;
        }
      } else {
        formData.expected_lifetime_days = null;
      }
      
      if (formData.reminder_days_before !== null && formData.reminder_days_before !== undefined && formData.reminder_days_before !== '') {
        formData.reminder_days_before = parseInt(formData.reminder_days_before);
        if (isNaN(formData.reminder_days_before)) {
          formData.reminder_days_before = 7; // Default-Wert
        }
      } else {
        formData.reminder_days_before = 7; // Default-Wert
      }
      
      // Boolean-Werte sicherstellen
      formData.reminder_enabled = !!formData.reminder_enabled;
      
      // Kategorie muss eine Nummer sein
      if (formData.category) {
        formData.category = parseInt(formData.category);
        if (isNaN(formData.category)) {
          this.snackBar.open('Ungültige Kategorie ausgewählt', 'Schließen', { duration: 3000 });
          this.isSubmitting = false;
          return;
        }
      }
      
      // Leere Strings zu null für optionale Felder
      ['description', 'barcode'].forEach(field => {
        if (formData[field] === '') {
          formData[field] = null;
        }
      });
      
      // Beschreibung auf 200 Zeichen begrenzen (Backend-Constraint)
      if (formData.description && formData.description.length > 200) {
        formData.description = formData.description.substring(0, 197) + '...';
      }
      
      // Location sollte nicht null sein wenn leer, sondern leerer String
      if (formData.location === '' || formData.location === null || formData.location === undefined) {
        formData.location = '';
      }
      
      // Felder entfernen die null sind und optional sind
      Object.keys(formData).forEach(key => {
        if (formData[key] === null && 
            ['purchase_date', 'purchase_price', 'expiry_date', 'expected_lifetime_days', 'description', 'barcode'].includes(key)) {
          delete formData[key];
        }
      });
      
      console.log('Form Data after processing:', formData);
      
      this.inventoryService.createItem(formData).subscribe({
        next: (item) => {
          this.snackBar.open('Gegenstand erfolgreich zum Inventar hinzugefügt!', 'Schließen', { 
            duration: 4000,
            panelClass: ['success-snackbar']
          });
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Fehler beim Hinzufügen:', error);
          console.error('Error details:', error.error);
          
          let errorMessage = 'Fehler beim Hinzufügen des Gegenstands';
          
          if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.error?.non_field_errors) {
            errorMessage = error.error.non_field_errors[0];
          } else if (error.error && typeof error.error === 'object') {
            // Detaillierte Validierungsfehler anzeigen
            const fieldErrors = [];
            for (const [field, errors] of Object.entries(error.error)) {
              if (Array.isArray(errors)) {
                fieldErrors.push(`${field}: ${errors.join(', ')}`);
              } else {
                fieldErrors.push(`${field}: ${errors}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage = `Validierungsfehler: ${fieldErrors.join('; ')}`;
            }
          }
          
          this.snackBar.open(errorMessage, 'Schließen', { 
            duration: 8000,
            panelClass: ['error-snackbar']
          });
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Bitte füllen Sie alle Pflichtfelder aus', 'Schließen', { duration: 3000 });
    }
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addItemForm.controls).forEach(key => {
      const control = this.addItemForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.addItemForm.reset();
    this.addItemForm = this.createItemForm();
  }

  private resetForm(): void {
    this.showAddForm = false;
    this.addItemForm.reset();
    this.addItemForm = this.createItemForm();
  }

  goToInventory(): void {
    this.router.navigate(['/inventory']);
  }

  getLocationDisplayName(location: string): string {
    const locationMap: { [key: string]: string } = {
      'wohnzimmer': 'Wohnzimmer',
      'schlafzimmer': 'Schlafzimmer', 
      'kueche': 'Küche',
      'bad': 'Bad',
      'buero': 'Büro',
      'keller': 'Keller',
      'dachboden': 'Dachboden',
      'garage': 'Garage',
      'balkon': 'Balkon',
      'sonstiges': 'Sonstiges'
    };
    
    return locationMap[location] || location;
  }

  // Getter für Template
  get formControls() {
    return this.addItemForm.controls;
  }
}
