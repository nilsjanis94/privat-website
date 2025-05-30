import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reminder, Item } from '../interfaces/inventory.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  getReminders(showAll: boolean = false): Observable<Reminder[]> {
    const params = showAll ? '?all=true' : '';
    return this.http.get<Reminder[]>(`${this.apiUrl}/reminders/${params}`);
  }

  dismissReminder(id: number): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.apiUrl}/reminders/${id}/dismiss/`, {});
  }

  getPendingReminders(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.apiUrl}/pending-reminders/`);
  }
}
