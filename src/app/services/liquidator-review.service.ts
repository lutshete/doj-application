import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// If you have environments, swap this for environment.apiBaseUrl
const API_BASE = 'http://localhost:3000/api';

// ===== Types (trimmed to essentials, aligned with your backend) =====
export type AppStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW'
  | 'APPROVED' | 'REJECTED' | 'LOCKED'
  | 'LICENSED' | 'EXAM_FAILED';

export interface FileRef {
  storage?: 'S3' | 'LOCAL';
  key?: string | null;
  url?: string | null;
  originalname?: string | null;
  mimetype?: string | null;
  size?: number;
}

export interface ReviewSnapshot {
  reviewer_id?: string;
  meeting_id?: string;
  review_status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Exam Result';
  outcome: string;
  further_comments?: string;
  annex?: any;
  created_at: string | Date;
}

export interface SectionsMinimal {
  personal?: { full_name?: string; identity_number?: string; status?: string; id_document?: FileRef };
  employment_trading?: { employer_name?: string; status?: string };
}

export interface LiquidatorApplicationDto {
  _id: string;
  applicant_id: string;
  window_id: string;
  status: AppStatus;
  submitted_at?: string;
  decided_at?: string;
  decided_by?: string;
  license_id?: string | null;
  sections?: SectionsMinimal | any;
  review_history?: ReviewSnapshot[];
  exam_result?: { outcome: 'PASS' | 'FAIL'; score?: number; satAt?: string; notes?: string };
  progress_percent?: number;
  form_complete?: boolean;
  is_locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  page: number;
  pages: number;
  limit: number;
  total: number;
  items: T[];
}

/** ApplicationReview API types (for start/propose/signoff/list) */
export interface ApplicationReview {
  _id: string;
  subject_type: 'APPLICATION' | 'RENEWAL';
  subject_id: string;
  reviewer_id: string;
  meeting_id?: string;
  review_status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  outcome: 'Pending' | 'Approved' | 'Rejected';
  further_comments?: string;
  annex?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewLockInfo {
  youHold: boolean;
  holder: string | null;
  until: string | null;
}

export interface ApplicationReviewDto {
  _id: string;
  subject_id: string;
  meeting_id?: string;
    reviewer_id?: string; 
  review_status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  outcome: 'Pending' | 'Approved' | 'Rejected';
  further_comments?: string;
  annex?: any;
  editor_user_id?: string | null;
  editor_lock_until?: string | null;
}

export interface AcquireLockResponse {
  review: ApplicationReviewDto;
  lock: ReviewLockInfo;
}

// liquidator-review.service.ts
export type SignoffState = {
  reviewId: string;
  meetingId: string;
  decision: 'Approved' | 'Rejected';
  outcome: 'Pending' | 'Approved' | 'Rejected';
  required: number;
  approvals: number;
  declined: number;
  pending: number;
  rosterSize: number;
  proposedBy: string;
  yourSign: 'PENDING' | 'APPROVED' | 'DECLINED';
  hideBannerForUserIds?: string[];
};


@Injectable({ providedIn: 'root' })
export class LiquidatorReviewService {
  private http = inject(HttpClient);

  // ---------- LIST (official console) ----------
  list(params: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    windowId?: string;
    applicantId?: string;
    isLocked?: boolean | string; // "true"/"false" | 1/0 | yes/no | on/off | boolean
    dateFrom?: string;           // YYYY-MM-DD or ISO
    dateTo?: string;             // YYYY-MM-DD or ISO
    sort?: 'createdAt' | 'decided_at' | 'submitted_at' | 'progress_percent' | 'status';
    dir?: 'asc' | 'desc';
  }): Observable<Paginated<LiquidatorApplicationDto>> {
    const toIsoStart = (d?: string) =>
      d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00.000Z` : (d || undefined);
    const toIsoEnd = (d?: string) =>
      d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T23:59:59.999Z` : (d || undefined);

    const normalizeIsLocked = (v: boolean | string | undefined | null): 'true' | 'false' | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      const s = String(v).trim().toLowerCase();
      if (['true','1','yes','on'].includes(s))  return 'true';
      if (['false','0','no','off'].includes(s)) return 'false';
      return undefined; // omit if unknown/empty
    };

    const cleaned: Record<string, string> = {};

    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      switch (k) {
        case 'q': {
          const q = String(v).trim();
          if (q) cleaned.q = q;
          return;
        }
        case 'isLocked': {
          const norm = normalizeIsLocked(v as any);
          if (norm !== undefined) cleaned.isLocked = norm;
          return;
        }
        case 'dateFrom': {
          const iso = toIsoStart(v as string);
          if (iso) cleaned.dateFrom = iso;
          return;
        }
        case 'dateTo': {
          const iso = toIsoEnd(v as string);
          if (iso) cleaned.dateTo = iso;
          return;
        }
        case 'page':
        case 'limit': {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) cleaned[k] = String(Math.floor(n));
          return;
        }
        default: {
          const s = String(v).trim();
          if (s !== '') cleaned[k] = s;
          return;
        }
      }
    });

    const httpParams = new HttpParams({ fromObject: cleaned });
    return this.http.get<Paginated<LiquidatorApplicationDto>>(
      `${API_BASE}/liquidator-apps`,
      { params: httpParams }
    );
  }

  // ---------- GET ONE ----------
  getOne(id: string): Observable<LiquidatorApplicationDto> {
    return this.http.get<LiquidatorApplicationDto>(`${API_BASE}/liquidator-apps/${id}`);
  }

  // ---------- ACTIONS ----------
  markUnderReview(
    id: string,
    arg?: string | { comment: string; meetingId?: string; annex?: any }
  ) {
    let body: any = {};
    if (typeof arg === 'string') {
      body = arg?.trim() ? { comment: arg.trim() } : {};
    } else if (arg && typeof arg === 'object') {
      body = arg;
    }
    return this.http.post<{ message: string; status: AppStatus }>(
      `${API_BASE}/liquidator-apps/${id}/under-review`,
      body
    );
  }

  approve(id: string, payload: { comment?: string; annex?: any; meetingId?: string }) {
    return this.http.post<{ message: string; status: AppStatus; examInviteId: string }>(
      `${API_BASE}/liquidator-apps/${id}/approve`,
      payload || {}
    );
  }

  reject(id: string, payload: { reason: string; annex?: any; meetingId?: string }) {
    return this.http.post<{ message: string; status: AppStatus }>(
      `${API_BASE}/liquidator-apps/${id}/reject`,
      payload
    );
  }

  addReviewNote(id: string, payload: { meetingId?: string; further_comments?: string; annex?: any }) {
    return this.http.post<{ message: string }>(
      `${API_BASE}/liquidator-apps/${id}/review-note`,
      payload || {}
    );
  }

  recordExamOutcome(id: string, payload: {
    outcome: 'PASS' | 'FAIL';
    score?: number;
    satAt?: string;     // ISO string
    notes?: string;
    inviteToken?: string;
  }) {
    return this.http.post<{ message: string; status: AppStatus; license?: { id: string; expiresAt: string } }>(
      `${API_BASE}/liquidator-apps/${id}/exam-outcome`,
      payload
    );
  }

  // ---------- NEW: ApplicationReview (meeting + signoffs) ----------

  /** Start (or resume) a review for an application, optionally binding it to a meeting and saving annex/comments. */


  /** Add note/annex directly to a specific ApplicationReview (not the app-level shortcut). */
 addNoteToReview(
  reviewId: string,
  body: { further_comments?: string; annex?: any }
): Observable<{ message: string; review: ApplicationReview }> {
  return this.http.post<{ message: string; review: ApplicationReview }>(
    `${API_BASE}/reviews/${reviewId}/note`,
    body || {}
  );
}

  /** Presenter proposes the decision; system then awaits quorum signoffs. */
proposeDecision(
  reviewId: string,
  body: { decision: 'Approved' | 'Rejected'; comment?: string; meetingId?: string }
): Observable<{ message: string; review: ApplicationReview }> {
  // matches: POST /reviews/:reviewId/propose-decision
  return this.http.post<{ message: string; review: ApplicationReview }>(
    `${API_BASE}/reviews/${reviewId}/propose-decision`,
    body
  );
}

  /** Quorum member signs off on the proposed decision. */
signoff(reviewId: string, approve: boolean, comment?: string) {
  // matches: POST /reviews/:reviewId/signoff
  return this.http.post<{ message: string; signoff: any; approvals: number; required: number }>(
    `${API_BASE}/reviews/${reviewId}/signoff`,
    { approve, comment: comment || '' }
  );
}
signoffStatus(reviewId: string) {
  // matches: GET /reviews/:reviewId/signoff-status
  return this.http.get<SignoffState>(`${API_BASE}/reviews/${reviewId}/signoff-status`);
}



  /** List reviews by application or meeting (for audit/UX). */
listReviews(params?: {
  subjectId?: string; // application id
  meetingId?: string;
  page?: number;
  limit?: number;
}): Observable<{ page: number; limit: number; total: number; pages: number; items: ApplicationReview[] }> {
  const httpParams = new HttpParams({ fromObject: (params as any) || {} });
  return this.http.get<{ page: number; limit: number; total: number; pages: number; items: ApplicationReview[] }>(
    `${API_BASE}/reviews`,
    { params: httpParams }
  );
}

  // liquidator-review.service.ts
// liquidator-review.service.ts
startReview(
  appId: string,
  payload: { meetingId?: string; further_comments?: string; annex?: any } = {}
) {
  // matches: POST /reviews/start/:appId
  return this.http.post<{ message: string; review: ApplicationReviewDto; lock?: ReviewLockInfo }>(
    `${API_BASE}/reviews/start/${appId}`,
    payload
  );
}

acquireReviewLock(reviewId: string, ttlSeconds = 90) {
  return this.http.post<{ message: string; lock: { youHold: boolean; holder?: string; until?: string } }>(
    `${API_BASE}/reviews/${reviewId}/lock`,
    { ttlSeconds }
  );
}

releaseReviewLock(reviewId: string) {
  return this.http.delete<{ message: string }>(`${API_BASE}/reviews/${reviewId}/lock`);
}

// in LiquidatorReviewService
forceReleaseLock(reviewId: string, reason: string) {
  // matches: POST /reviews/:reviewId/lock/force
  return this.http.post<{ message: string; review: ApplicationReviewDto }>(
    `${API_BASE}/reviews/${reviewId}/lock/force`,
    { reason }
  );
}
/** Read lock status for UI. */
lockStatus(reviewId: string) {
  // matches: GET /reviews/:reviewId/lock
  return this.http.get<{ _id: string; editor_user_id: string | null; editor_lock_until: string | null }>(
    `${API_BASE}/reviews/${reviewId}/lock`
  );
}

acquireLock(reviewId: string, ttlSeconds = 90) {
  // matches: POST /reviews/:reviewId/lock
  return this.http.post<{ message: string; lock: ReviewLockInfo; review?: ApplicationReviewDto }>(
    `${API_BASE}/reviews/${reviewId}/lock`,
    { ttlSeconds }
  );
}


/** Release the edit lock you hold. */
releaseLock(reviewId: string) {
  // matches: DELETE /reviews/:reviewId/lock
  return this.http.delete<{ message: string }>(`${API_BASE}/reviews/${reviewId}/lock`);
}
}
