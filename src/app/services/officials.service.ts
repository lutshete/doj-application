import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Preapproved {
  _id?: string;
  email: string;
  role: 'OFFICIAL' | 'CHIEF_MASTER';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Paged<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class OfficialsService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api/officials/preapproved';

  /** GET list (accepts optional filters; maps paged or array responses to a plain array) */
  list(params?: {
    page?: number;
    limit?: number;
    q?: string;
    role?: '' | 'OFFICIAL' | 'CHIEF_MASTER';
    sort?: 'email' | 'role' | 'notes' | 'createdAt';
    dir?: 'asc' | 'desc';
  }): Observable<Preapproved[]> {
    let p = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });

    return this.http
      .get<Preapproved[] | Paged<Preapproved>>(this.base, { params: p })
      .pipe(map(res => (Array.isArray(res) ? res : res.items || [])));
  }

  /** POST create */
  create(row: Omit<Preapproved, '_id' | 'createdAt' | 'updatedAt'>): Observable<Preapproved> {
    const dto = {
      email: (row.email || '').trim(),
      role: row.role || 'OFFICIAL',
      notes: (row.notes || '').trim(),
    };
    return this.http.post<Preapproved>(this.base, dto);
  }

  /** PATCH update */
  update(id: string, row: Partial<Preapproved>): Observable<Preapproved> {
    const dto: Partial<Preapproved> = {
      ...(row.email != null ? { email: row.email.trim() } : {}),
      ...(row.role ? { role: row.role } : {}),
      ...(row.notes != null ? { notes: row.notes.trim() } : {}),
    };
    return this.http.patch<Preapproved>(`${this.base}/${id}`, dto);
  }

  /** DELETE remove */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
