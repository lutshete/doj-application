import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type InviteStatus = 'PENDING'|'ACCEPTED'|'DECLINED';

export interface ExamInvite {
  _id: string;
  application_id?: { _id: string; referenceNo?: string; status?: string };
  applicant_id?: { _id: string; firstName?: string; lastName?: string; email?: string };
  token: string;
  status: InviteStatus;
  respondedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface ExamAttendance {
  _id: string;
  invite_id: ExamInvite | string;
  checkedInAt?: string;
  checkedInBy?: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  checkedOutAt?: string;
  seat?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface Paginated<T> { items: T[]; total: number; }

@Injectable({ providedIn: 'root' })
export class ExamInvitesService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api/exam-invites';

  list(params: {
    q?: string; status?: InviteStatus | '';
    sort?: 'createdAt'|'updatedAt'|'status'|'respondedAt'|'token';
    dir?: 'asc'|'desc';
    page?: number; limit?: number;
  }): Observable<Paginated<ExamInvite>> {
    let p = new HttpParams();
    Object.entries(params || {}).forEach(([k,v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<Paginated<ExamInvite> | ExamInvite[]>(this.base, { params: p }).pipe(
      map((r: any) => Array.isArray(r) ? ({ items: r, total: r.length }) : r)
    );
  }

  getOne(id: string){ return this.http.get<ExamInvite>(`${this.base}/${id}`); }
  statusByToken(token: string){ return this.http.get<any>(`${this.base}/status/${encodeURIComponent(token)}`); }

  // Registration (attendance)
  checkInByToken(body: { token: string; seat?: string; note?: string }){
    return this.http.post<{ invite: ExamInvite; attendance: ExamAttendance }>(`${this.base}/register/checkin`, body);
  }
  checkOutByToken(body: { token: string }){
    return this.http.post<{ invite: ExamInvite; attendance: ExamAttendance }>(`${this.base}/register/checkout`, body);
  }

  listAttendance(params?: { sort?: string; dir?: 'asc'|'desc' }){
    let p = new HttpParams();
    if (params?.sort) p = p.set('sort', params.sort);
    if (params?.dir)  p = p.set('dir', params.dir);
    return this.http.get<ExamAttendance[]>(`${this.base}/register/list`, { params: p });
  }
}
