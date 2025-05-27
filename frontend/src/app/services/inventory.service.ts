import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/inventory/categories/${id}/`);
  }

  // Items
  getItems(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/inventory/items/`)
      .pipe(
        map(response => {
          if (response && response.results) {
            return response.results;
          }
          return Array.isArray(response) ? response : [];
        })
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
}