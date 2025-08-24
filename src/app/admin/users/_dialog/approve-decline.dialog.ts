import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-approve-decline-dialog',
  template: `
  <section class="dlg" role="dialog" aria-modal="true" [attr.aria-labelledby]="'dlgTitle'" [attr.aria-describedby]="'dlgDesc'">
    <!-- Header -->
    <header class="dlg__hdr" [class.ok]="approve" [class.bad]="!approve">
      <div class="ic" aria-hidden="true">
        <span class="material-icons">{{ approve ? 'task_alt' : 'do_not_disturb_on' }}</span>
      </div>
      <div>
        <h3 class="title" id="dlgTitle">{{ approve ? 'Approve Official' : 'Decline Official' }}</h3>
        <div class="sub muted">For: <strong>{{ data.user?.email }}</strong></div>
      </div>
    </header>

    <!-- User summary -->
    <div class="user">
      <div class="avatar" aria-hidden="true">{{ initials }}</div>
      <div class="meta">
        <div class="name">
          {{ first }} {{ last }}
          <span *ngIf="data.user?.officialFlags?.isAdminOfficial" class="chip xs admin">
            <span class="material-icons">verified_user</span> ADMIN
          </span>
        </div>
        <div class="badges">
          <span class="chip xs" [ngClass]="data.user?.role">{{ data.user?.role }}</span>
          <span class="badge xs" [class.ok]="data.user?.isActive" [class.bad]="!data.user?.isActive">
            <span class="dot" [class.ok]="data.user?.isActive" [class.bad]="!data.user?.isActive"></span>
            {{ data.user?.isActive ? 'Active' : 'Inactive' }}
          </span>
          <span class="badge xs"
                [class.warn]="data.user?.approval?.status==='PENDING'"
                [class.ok]="data.user?.approval?.status==='APPROVED' || data.user?.approval?.status==='NOT_REQUIRED'"
                [class.bad]="data.user?.approval?.status==='DECLINED'">
            {{ data.user?.approval?.status || '—' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="dlg__content" id="dlgDesc">
      <ng-container *ngIf="approve; else declineTpl">
        <div class="note ok">
          <span class="material-icons" aria-hidden="true">info</span>
          Approving will enable official access immediately.
        </div>
        <p class="mt-2">
          Are you sure you want to <strong>approve</strong> this official account?
        </p>
      </ng-container>

      <ng-template #declineTpl>
        <div class="note bad">
          <span class="material-icons" aria-hidden="true">warning</span>
          Declining will disable access and mark the account as <strong>DECLINED</strong>.
        </div>

        <label class="lbl">Reason (optional)</label>
        <div class="chips" role="group" aria-label="Quick reasons">
          <button type="button" class="chip-select" [class.sel]="reason==='Insufficient verification'"
                  (click)="reason='Insufficient verification'">Insufficient verification</button>
          <button type="button" class="chip-select" [class.sel]="reason==='Duplicate account'"
                  (click)="reason='Duplicate account'">Duplicate account</button>
          <button type="button" class="chip-select" [class.sel]="reason==='Policy non-compliance'"
                  (click)="reason='Policy non-compliance'">Policy non-compliance</button>
        </div>

        <textarea autofocus [(ngModel)]="reason" rows="4" class="ta"
                  placeholder="Add details (optional)"></textarea>
      </ng-template>
    </div>

    <!-- Actions -->
    <footer class="dlg__actions">
      <button class="btn outline" (click)="close()">
        <span class="material-icons">close</span>
        Cancel
      </button>
      <button class="btn" [class.danger]="!approve" (click)="confirm()">
        <span class="material-icons">{{ approve ? 'task_alt' : 'do_not_disturb_on' }}</span>
        {{ approve ? 'Approve' : 'Decline' }}
      </button>
    </footer>
  </section>
  `,
  styles: [`
/* container: fixed paddings, no negative margins, content scrolls only */
.dlg{
  width: min(560px, calc(100vw - 40px));
  max-height: min(82vh, 640px);
  display: flex; flex-direction: column;
  overflow: hidden; /* kill stray horizontal scrollbar */
  background: #fff;
}

/* Header */
.dlg__hdr{
  display:flex; align-items:center; gap:12px;
  padding:12px 16px; border-bottom:1px solid #e6e8eb;
  background: #fff;
}
.dlg__hdr.ok{ box-shadow: inset 0 -44px 0 0 rgba(40,167,69,0.06); }
.dlg__hdr.bad{ box-shadow: inset 0 -44px 0 0 rgba(220,53,69,0.06); }
.ic{
  width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
  background:#fff; border:1px solid #e6e8eb;
}
.dlg__hdr.ok .ic .material-icons{ color:#28a745; }
.dlg__hdr.bad .ic .material-icons{ color:#dc3545; }
.title{ margin:0; font-size:18px; font-weight:800; color:#0b1220; }
.sub{ font-size:12px; color:#6b7280; }

/* User summary */
.user{ display:flex; align-items:center; gap:12px; padding:12px 16px 0; }
.avatar{
  width:36px; height:36px; border-radius:50%; background:#e2e8f0; color:#0f172a;
  display:grid; place-items:center; font-weight:800; font-size:12px;
}
.meta .name{ font-weight:700; color:#0b1220; }
.badges{ display:flex; gap:6px; margin-top:4px; flex-wrap:wrap; }

/* Chips & badges (match page styling) */
.chip.xs{ padding:2px 6px; border:1px solid #e6e8eb; border-radius:999px; font-size:11px; font-weight:700; background:#fff; }
.chip.xs.admin{ background:rgba(0,123,255,.10); color:#007bff; border-color:#cfe2ff; }
.chip.LIQUIDATOR{ background:#eef2ff; color:#3730a3; border-color:#e0e7ff; }
.chip.OFFICIAL{ background:#eff6ff; color:#1d4ed8; border-color:#dbeafe; }
.chip.CHIEF_MASTER{ background:#ecfeff; color:#0e7490; border-color:#cffafe; }

.badge.xs{ display:inline-flex; align-items:center; gap:6px; padding:2px 6px; border-radius:8px; font-size:11px; font-weight:800; background:#f3f4f6; color:#111827; }
.badge .dot{ width:6px; height:6px; border-radius:50%; background:#9ca3af; }
.badge.ok{ background:rgba(40,167,69,.12); color:#28a745; }
.badge.bad{ background:rgba(220,53,69,.12); color:#dc3545; }
.badge.warn{ background:rgba(255,193,7,.15); color:#b07d00; }
.badge .dot.ok{ background:#28a745; }
.badge .dot.bad{ background:#dc3545; }

/* Content (scroll area) */
.dlg__content{
  padding:12px 16px;
  overflow-y:auto; overflow-x:hidden;
  flex: 1 1 auto;
}
.lbl{ display:block; margin-top:12px; font-size:12px; color:#6b7280; font-weight:600; }
.ta{
  width:100%; margin-top:8px; padding:10px; border:1px solid #e6e8eb; border-radius:10px;
  resize:vertical; min-height:90px; font-family:inherit; font-size:14px;
}
.ta:focus{ outline:2px solid rgba(244,127,12,.35); border-color:#f47f0c; }
.chips{ display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
.chip-select{
  padding:6px 10px; border:1px solid #e6e8eb; border-radius:999px; background:#fff; cursor:pointer; font-weight:600; font-size:12px;
}
.chip-select:hover{ border-color:#f47f0c33; background:#fff7f0; }
.chip-select.sel{ border-color:#f47f0c; background:#fff3e6; }

.note{
  display:flex; align-items:center; gap:8px; font-size:13px; border:1px solid #e6e8eb; border-radius:10px; padding:8px 10px; background:#fff;
}
.note.ok .material-icons{ color:#28a745; }
.note.bad .material-icons{ color:#dc3545; }
.mt-2{ margin-top:8px; }

/* Actions (always visible) */
.dlg__actions{
  display:flex; justify-content:flex-end; gap:8px;
  padding:12px 16px; border-top:1px solid #e6e8eb; background:#fff;
}
.btn{
  display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border:none; border-radius:10px; font-weight:800; cursor:pointer;
  background:#f47f0c; color:#fff;
}
.btn:hover{ background:#e76a00; }
.btn.outline{ background:#fff; color:#111827; border:1px solid #e6e8eb; }
.btn.outline:hover{ border-color:#f47f0c; }
.btn.danger{ background:#dc3545; }
.btn.danger:hover{ background:#c42e3b; }

.muted{ color:#6b7280; }
.material-icons{ font-size:18px; line-height:1; }
  `]
})
export class ApproveDeclineDialog {
  data = inject(MAT_DIALOG_DATA) as { mode: 'approve' | 'decline'; user: any };
  ref = inject(MatDialogRef<ApproveDeclineDialog>);
  reason = '';

  get approve(){ return this.data?.mode === 'approve'; }
  get first(){ return this.data?.user?.firstName || ''; }
  get last(){ return this.data?.user?.lastName || ''; }
  get initials(){
    const f = (this.first?.[0] || '').toUpperCase();
    const l = (this.last?.[0] || '').toUpperCase();
    return (f + l) || (this.data?.user?.email?.[0] || '?').toUpperCase();
  }

  close(){ this.ref.close(); }
  confirm(){ this.ref.close(this.approve ? true : this.reason); }
}
