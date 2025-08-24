import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuditLog, Paged } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  base = '/api/audit';

  list(opts: { page?:number; limit?:number; actorId?:string; action?:string; targetModel?:string; from?:string; to?:string }) {
    let p = new HttpParams();
    Object.entries(opts||{}).forEach(([k,v]) => v!=null && (p = p.set(k,String(v))));
    return this.http.get<Paged<AuditLog>>(this.base, { params: p });
  }
}
