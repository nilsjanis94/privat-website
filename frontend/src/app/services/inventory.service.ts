import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Item, Category } from '../interfaces/inventory.interface';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(private http: HttpClient) {}

  // Categories
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/inventory/categories/`)
      .pipe(
        map(response => {
          if (response && response.results) {
            return response.results;
          }
          return Array.isArray(response) ? response : [];
        })
      );
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/inventory/categories/`, category);
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/inventory/categories/${id}/`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/inventory/categories/${id}/`);
  }

  // Items
  getItems(includeConsumed: boolean = false): Observable<Item[]> {
    let params = new HttpParams();
    if (!includeConsumed) {
      params = params.set('consumed', 'false');
    }
    
    return this.http.get<any>(`${environment.apiUrl}/inventory/items/`, { params })
      .pipe(
        map(response => response.results || response)
      );
  }

  createItem(item: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/inventory/items/`, item);
  }

  updateItem(id: number, item: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/inventory/items/${id}/`, item);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/inventory/items/${id}/`);
  }

  // Dashboard
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/inventory/dashboard/`);
  }

  // Neue Methoden hinzufügen
  markItemConsumed(itemId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/inventory/items/${itemId}/consume/`, {});
  }

  unmarkItemConsumed(itemId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/inventory/items/${itemId}/unconsume/`, {});
  }

  // Neue Methode hinzufügen
  getExpensesChartData(period: string = '1M'): Observable<any> {
    return this.http.get(`${environment.apiUrl}/inventory/expenses-chart/?period=${period}`);
  }

  // Barcode-Suche
  searchByBarcode(barcode: string): Observable<Item[]> {
    return this.http.get<any>(`${environment.apiUrl}/inventory/barcode/${barcode}/search/`)
      .pipe(
        map(response => response.results || response || [])
      );
  }

  // Item hinzufügen (Alias für createItem)
  addItem(item: any): Observable<any> {
    return this.createItem(item);
  }
}