import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ApplicationWindow {
  _id: string;
  openingDate: string; // ISO
  closingDate: string; // ISO
  createdBy?: string;
}

@Injectable({ providedIn: 'root' })
export class ApplicationWindowService {
  private http = inject(HttpClient);

  private readonly API = 'http://localhost:3000';
  private readonly BASE = `${this.API}/api/application-windows`;

  /** Public/applicant: get the currently active/open window (or null) */
  getActive(): Observable<ApplicationWindow | null> {
    return this.http.get<ApplicationWindow | null>(`${this.BASE}/active`);
  }

  /** Admin/chief: create a new window */
  create(openingDate: string, closingDate?: string): Observable<ApplicationWindow> {
    return this.http.post<ApplicationWindow>(this.BASE, { openingDate, closingDate });
  }

  /** Admin/chief: extend a window by 1..7 days (hard cap enforced backend) */
  extend(id: string, days = 7): Observable<{ message: string; closingDate: string }> {
    return this.http.post<{ message: string; closingDate: string }>(`${this.BASE}/${encodeURIComponent(id)}/extend`, { days });
  }

  /** Admin/chief: list windows (optionally filter by year/from/to) */
  list(params?: { year?: number; from?: string; to?: string }): Observable<ApplicationWindow[]> {
    return this.http.get<ApplicationWindow[]>(this.BASE, { params: params as any });
  }

  /** Get a specific window by id */
  getOne(id: string): Observable<ApplicationWindow> {
    return this.http.get<ApplicationWindow>(`${this.BASE}/${encodeURIComponent(id)}`);
  }
}
