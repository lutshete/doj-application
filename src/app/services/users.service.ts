import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Paged, UserLite } from '../core/models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';



  list(opts: {
    page?: number; limit?: number; q?: string; role?: string;
    isActive?: boolean; approvalStatus?: string; sort?: string; dir?: 'asc'|'desc';
  }) {
    let p = new HttpParams();
    Object.entries(opts || {}).forEach(([k,v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k,String(v));
    });
    return this.http.get<Paged<UserLite>>(`${this.base}/users`, { params: p });
  }

  approveOfficial(id: string) {
    return this.http.patch<{message:string}>(`${this.base}/users/${id}/approve`, {});
  }
  declineOfficial(id: string, reason?: string) {
    return this.http.patch<{message:string}>(`${this.base}/users/${id}/decline`, { reason });
  }
  setAdminFlag(id: string, isAdminOfficial: boolean) {
    return this.http.patch(`${this.base}/users/${id}/admin-flag`, { isAdminOfficial });
  }
  deactivate(id: string, reason?: string) {
    return this.http.patch(`${this.base}/users/${id}/deactivate`, { reason });
  }
  activate(id: string) {
    return this.http.patch(`${this.base}/users/${id}/activate`, {});
  }

  // Auth helpers
  me() { return this.http.get(`${this.base}/auth/me`); }
  requestPasswordReset(email: string) {
    return this.http.post(`${this.base}/auth/request-password-reset`, { email });
  }
}
