import { Component, Input, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { MeetingsService } from '../../services/meetings.service';

@Component({

  selector:'app-quorum-panel',

  template: `
  <div class="qpanel" *ngIf="meetings?.length">
    <div class="qrow" *ngFor="let m of meetings">
      <div class="meta">
        <div>{{m.start | date:'short'}} → {{m.end | date:'short'}}</div>
        <div class="muted">{{ m.link || m.venue || '—' }}</div>
      </div>
      <div class="status">
        <button class="btn xs outline" (click)="refresh(m._id)">Refresh Quorum</button>
        <div class="chips" *ngIf="summary[m._id] as s">
          <span class="chip ok">Accepted: {{s.accepted}}</span>
          <span class="chip warn">Pending: {{s.pending}}</span>
          <span class="chip bad">Declined: {{s.declined}}</span>
          <span class="chip" [class.ok]="s.hasQuorum" [class.bad]="!s.hasQuorum">Has Quorum: {{s.hasQuorum ? 'Yes' :'No'}}</span>
        </div>
      </div>
    </div>
  </div>
  `,
  styles:[`.qpanel{background:#fafafa;border:1px dashed #e5e7eb;border-radius:8px;margin:8px 0;padding:8px}
.qrow{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-top:1px solid #eee}
.qrow:first-child{border-top:none}
.btn.xs{padding:4px 8px;font-size:12px}
.chips{display:flex;gap:6px}
.chip{padding:2px 6px;border-radius:6px;background:#eef2ff;font-size:12px}
.chip.ok{background:#dcfce7}
.chip.bad{background:#fee2e2}
.chip.warn{background:#fef3c7}
.muted{color:#6b7280;font-size:12px}`]
})
export class QuorumPanelComponent {
  @Input() meetings: any[] = [];
  svc = inject(MeetingsService);
  summary: Record<string, any> = {};

  refresh(id: string){
    this.svc.quorumSummary(id).subscribe(r=> this.summary[id] = r.quorum);
  }
}
