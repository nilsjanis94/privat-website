import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BarcodeProduct, Item } from '../interfaces/inventory.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  searchByBarcode(barcode: string): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/barcode/${barcode}/search/`);
  }

  getProductInfo(barcode: string): Observable<BarcodeProduct> {
    return this.http.get<BarcodeProduct>(`${this.apiUrl}/barcode/${barcode}/info/`);
  }

  // Hilfsmethode für Barcode-Validierung
  isValidBarcode(barcode: string): boolean {
    // EAN-13 oder UPC-A Validierung (13 oder 12 Ziffern)
    const cleanBarcode = barcode.replace(/\D/g, '');
    return cleanBarcode.length === 12 || cleanBarcode.length === 13;
  }

  // Hilfsmethode für Barcode-Formatierung
  formatBarcode(barcode: string): string {
    return barcode.replace(/\D/g, '');
  }
}
