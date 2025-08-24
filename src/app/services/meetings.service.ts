import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Meeting, QuorumSummary } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MeetingsService {
  private http = inject(HttpClient);
  private base = 'http://localhost:3000/api';

  createForWindow(windowId: string, body: { start: string; end: string; link?: string; venue?: string }) {
    return this.http.post<Meeting>(`${this.base}/windows/${windowId}/meetings`, body);
  }
  listForWindow(windowId: string, from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<Meeting[]>(`${this.base}/windows/${windowId}/meetings`, { params });
  }
  inviteQuorum(meetingId: string, userIds: string[]) {
    return this.http.post<{message:string; meetingId:string; quorum: QuorumSummary}>(`${this.base}/meetings/${meetingId}/invite`, { userIds });
  }
  updateMeeting(id: string, body: Partial<{start: string; end: string; link: string; venue: string}>) {
    return this.http.patch<Meeting>(`${this.base}/meetings/${id}`, body);
  }
  quorumSummary(id: string) {
    return this.http.get<{meeting: Meeting; quorum: QuorumSummary}>(`${this.base}/meetings/${id}/quorum`);
  }
}
