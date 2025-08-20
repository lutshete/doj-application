import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type SectionKey =
  | 'personal'
  | 'business'
  | 'employment_trading'
  | 'infrastructure_offices'
  | 'qualifications_memberships'
  | 'relationship'
  | 'appointments_employment'
  | 'tax_bond_bank';

export interface LiquidatorApplication {
  _id: string;
  window_id: string;
  status: 'DRAFT' | 'SUBMITTED' | string;
  editable_until?: string | null;
  sections?: any;
  progress_percent?: number;
  form_complete?: boolean;
  submitted_at?: string | null;
  decided_at?: string | null;
  is_locked?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LiquidatorApplicationService {
  private http = inject(HttpClient);

  private readonly API = 'http://localhost:3000';
  private readonly BASE = `${this.API}/api/liquidator-apps`;

  /** Applicant: create or fetch draft for a window */
  upsertDraft(windowId: string): Observable<LiquidatorApplication> {
    return this.http.post<LiquidatorApplication>(`${this.BASE}/draft`, { windowId });
  }

  /** Applicant: my apps */
  getMine(): Observable<LiquidatorApplication[]> {
    return this.http.get<LiquidatorApplication[]>(`${this.BASE}/mine`);
  }

  /** Get one app (applicant can see own; officials/chief/admin can see any) */
  getById(id: string): Observable<LiquidatorApplication> {
    return this.http.get<LiquidatorApplication>(`${this.BASE}/${encodeURIComponent(id)}`);
  }

  /**
   * Update ONE section (PATCH multipart).
   * IMPORTANT: send FormData; don't set Content-Type manually.
   */
  updateSection(id: string, sectionKey: SectionKey, formData: FormData): Observable<LiquidatorApplication> {
    const url = `${this.BASE}/${encodeURIComponent(id)}/sections/${encodeURIComponent(sectionKey)}`;
    return this.http.patch<LiquidatorApplication>(url, formData);
  }

  /** Applicant: submit the full application */
  submit(id: string): Observable<{ message: string; id: string; status: string }> {
    return this.http.post<{ message: string; id: string; status: string }>(
      `${this.BASE}/${encodeURIComponent(id)}/submit`,
      {}
    );
  }

  /** Officials: list with filters/pagination */
  list(params?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    windowId?: string;
    applicantId?: string;
    isLocked?: boolean;
    dateFrom?: string; // ISO
    dateTo?: string;   // ISO
    sort?: 'createdAt' | 'decided_at' | 'submitted_at' | 'progress_percent' | 'status';
    dir?: 'asc' | 'desc';
  }): Observable<{ page: number; limit: number; total: number; pages: number; items: LiquidatorApplication[] }> {
    return this.http.get<{ page: number; limit: number; total: number; pages: number; items: LiquidatorApplication[] }>(
      this.BASE,
      { params: this.objToHttpParams(params || {}) }
    );
  }

  /** Officials: mark under review */
  markUnderReview(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/${encodeURIComponent(id)}/under-review`, {});
  }

  /** Officials: approve (for exam invitation) */
  approve(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/${encodeURIComponent(id)}/approve`, {});
  }

  /** Officials: reject */
  reject(id: string, reason?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/${encodeURIComponent(id)}/reject`, { reason });
  }

  /** Officials: add review note */
  addReviewNote(id: string, note: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/${encodeURIComponent(id)}/review-note`, { note });
  }

  /**
   * Officials: record exam outcome
   * body example: { outcome: 'PASS' | 'FAIL', score?: number }
   */
  recordExamOutcome(id: string, body: { outcome: 'PASS' | 'FAIL'; score?: number; comment?: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.BASE}/${encodeURIComponent(id)}/exam-outcome`, body);
  }

  // ---- utils
  private objToHttpParams(obj: Record<string, any>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) v.forEach((vv) => (p = p.append(k, String(vv))));
      else p = p.set(k, String(v));
    }
    return p;
  }
}
