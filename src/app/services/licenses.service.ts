import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { License, Paged } from '../core/models';

@Injectable({ providedIn: 'root' })
export class LicensesService {
  private http = inject(HttpClient);
  private base = '/api/licenses';

  list(opts: { page?: number; limit?: number; status?: string; holder?: string }) {
    let p = new HttpParams();
    Object.entries(opts||{}).forEach(([k,v]) => v!=null && p.set(k,String(v)));
    return this.http.get<Paged<License>>(this.base, { params: p });
  }
  setStatus(id: string, status: string, reason?: string) {
    return this.http.patch(`${this.base}/${id}/status`, { status, reason });
  }
}
