import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { AppWindow } from '../core/models';

export type ListWindowsOpts = {
  year?: number; // filter by calendar year
  from?: string; // ISO date string
  to?: string;   // ISO date string
};

export type WindowYearStatus = {
  year: number;
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'NONE';
  openingDate?: string | null;
  closingDate?: string | null;
  windowId?: string | null;
};

@Injectable({ providedIn: 'root' })
export class WindowsService {
  private http = inject(HttpClient);
  base = 'http://localhost:3000/api';

  /** GET /application-windows  (staff only) */
  list(opts: ListWindowsOpts = {}) {
    let params = new HttpParams();
    if (opts.year != null) params = params.set('year', String(opts.year));
    if (opts.from) params = params.set('from', opts.from);
    if (opts.to) params = params.set('to', opts.to);
    return this.http.get<AppWindow[]>(`${this.base}/application-windows`, { params });
  }

  /** GET /application-windows/active */
  active() {
    return this.http.get<AppWindow | null>(`${this.base}/application-windows/active`);
  }

  /** GET /application-windows/:id */
  getOne(id: string) {
    return this.http.get<AppWindow>(`${this.base}/application-windows/${id}`);
  }

  /** POST /application-windows */
  create(openingDate: string, closingDate?: string) {
    const body: any = { openingDate };
    if (closingDate) body.closingDate = closingDate;
    return this.http.post<AppWindow>(`${this.base}/application-windows`, body);
  }

  /** POST /application-windows/:id/extend (days: 1..7) */
  extend(id: string, days: number = 7) {
    return this.http.post<{ message: string; closingDate: string }>(
      `${this.base}/application-windows/${id}/extend`,
      { days },
    );
  }

  /** POST /application-windows/sweep */
  sweep() {
    return this.http.post<{ message: string; planned: number; open: number; closed: number; normalized: number; }>(
      `${this.base}/application-windows/sweep`, {}
    );
  }

  /** POST /application-windows/:id/open */
  open(id: string) {
    return this.http.post<{ message: string }>(`${this.base}/application-windows/${id}/open`, {});
  }

  /** POST /application-windows/:id/close */
  close(id: string) {
    return this.http.post<{ message: string }>(`${this.base}/application-windows/${id}/close`, {});
  }

  /* ===================== NEW ===================== */

  /** GET /application-windows/status?year=YYYY */
  yearStatus(year: number) {
    const params = new HttpParams().set('year', String(year));
    return this.http.get<WindowYearStatus>(`${this.base}/application-windows/status`, { params });
  }

  /** GET /application-windows/status/current */
  currentYearStatus() {
    return this.http.get<WindowYearStatus>(`${this.base}/application-windows/status/current`);
  }

  /** Convenience: true if the current year's window is CLOSED */
  currentYearIsClosed() {
    return this.currentYearStatus().pipe(map(s => s.status === 'CLOSED'));
  }
}
