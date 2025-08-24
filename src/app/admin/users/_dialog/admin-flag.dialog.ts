import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-flag-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="dlg" role="dialog" aria-modal="true" [attr.aria-labelledby]="'flagTitle'">
    <!-- Header -->
    <header class="dlg__hdr" [class.ok]="!isAdmin" [class.bad]="isAdmin">
      <div class="ic" aria-hidden="true">
        <span class="material-icons">{{ isAdmin ? 'remove_moderator' : 'verified_user' }}</span>
      </div>
      <div>
        <h3 class="title" id="flagTitle">
          {{ isAdmin ? 'Remove Admin Official' : 'Grant Admin Official' }}
        </h3>
        <div class="sub muted">User: <strong>{{ data.user?.email }}</strong></div>
      </div>
    </header>

    <!-- User summary -->
    <div class="user">
      <div class="avatar" aria-hidden="true">{{ initials }}</div>
      <div class="meta">
        <div class="name">
          {{ first }} {{ last }}
          <span *ngIf="isAdmin" class="chip xs admin">
            <span class="material-icons">verified_user</span> ADMIN
          </span>
        </div>
        <div class="badges">
          <span class="chip xs" [ngClass]="data.user?.role">{{ data.user?.role }}</span>
          <span class="badge xs" [class.ok]="data.user?.isActive" [class.bad]="!data.user?.isActive">
            <span class="dot" [class.ok]="data.user?.isActive" [class.bad]="!data.user?.isActive"></span>
            {{ data.user?.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="dlg__content">
      <ng-container *ngIf="!isAdmin; else revokeTpl">
        <div class="note ok">
          <span class="material-icons" aria-hidden="true">info</span>
          Granting <b>Admin Official</b> gives elevated capabilities:
        </div>
        <ul class="list">
          <li>Approve / decline officials</li>
          <li>Activate / deactivate accounts</li>
          <li>Manage application windows & meetings</li>
          <li>Access audit logs</li>
        </ul>
      </ng-container>

      <ng-template #revokeTpl>
        <div class="note bad">
          <span class="material-icons" aria-hidden="true">warning</span>
          Removing <b>Admin Official</b> immediately revokes these permissions.
        </div>
      </ng-template>
    </div>

    <!-- Actions -->
    <footer class="dlg__actions">
      <button class="btn outline" (click)="ref.close()">
        <span class="material-icons">close</span>
        Cancel
      </button>
      <button class="btn" [class.danger]="isAdmin" (click)="confirm()">
        <span class="material-icons">{{ isAdmin ? 'remove_moderator' : 'verified_user' }}</span>
        {{ isAdmin ? 'Unset Admin' : 'Set Admin' }}
      </button>
    </footer>
  </section>
  `,
  styles: [`
/* container: same shell as ApproveDeclineDialog */
.dlg{
  width: min(560px, calc(100vw - 40px));
  max-height: min(82vh, 640px);
  display:flex; flex-direction:column; overflow:hidden; background:#fff;
  font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

/* Header */
.dlg__hdr{
  display:flex; align-items:center; gap:12px;
  padding:12px 16px; border-bottom:1px solid #e6e8eb; background:#fff;
}
.dlg__hdr.ok{ box-shadow: inset 0 -44px 0 0 rgba(40,167,69,.06); }
.dlg__hdr.bad{ box-shadow: inset 0 -44px 0 0 rgba(220,53,69,.06); }
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

/* Chips & badges (same tokens as list screen) */
.chip.xs{ padding:2px 6px; border:1px solid #e6e8eb; border-radius:999px; font-size:11px; font-weight:700; background:#fff; }
.chip.xs.admin{ background:rgba(0,123,255,.10); color:#007bff; border-color:#cfe2ff; }
.chip.LIQUIDATOR{ background:#eef2ff; color:#3730a3; border-color:#e0e7ff; }
.chip.OFFICIAL{ background:#eff6ff; color:#1d4ed8; border-color:#dbeafe; }
.chip.CHIEF_MASTER{ background:#ecfeff; color:#0e7490; border-color:#cffafe; }

.badge.xs{ display:inline-flex; align-items:center; gap:6px; padding:2px 6px; border-radius:8px; font-size:11px; font-weight:800; background:#f3f4f6; color:#111827; }
.badge .dot{ width:6px; height:6px; border-radius:50%; background:#9ca3af; }
.badge.ok{ background:rgba(40,167,69,.12); color:#28a745; }
.badge.bad{ background:rgba(220,53,69,.12); color:#dc3545; }

/* Content area */
.dlg__content{ padding:12px 16px; overflow:auto; }
.note{
  display:flex; align-items:center; gap:8px; font-size:13px;
  border:1px solid #e6e8eb; border-radius:10px; padding:8px 10px; background:#fff;
}
.note.ok .material-icons{ color:#28a745; }
.note.bad .material-icons{ color:#dc3545; }
.list{ margin:8px 0 0 24px; padding:0; font-size:13px; }
.list li{ margin:4px 0; }

/* Actions */
.dlg__actions{
  display:flex; justify-content:flex-end; gap:8px;
  padding:12px 16px; border-top:1px solid #e6e8eb; background:#fff;
}
.btn{
  display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border:none; border-radius:10px; font-weight:800; cursor:pointer;
  background:#F47F0C; color:#fff;
}
.btn:hover{ background:#e76a00; }
.btn.outline{ background:#fff; color:#111827; border:1px solid #e6e8eb; }
.btn.outline:hover{ border-color:#F47F0C; }
.btn.danger{ background:#dc3545; }
.btn.danger:hover{ background:#c42e3b; }

.material-icons{ font-size:18px; line-height:1; }
  `]
})
export class AdminFlagDialog {
  data = inject(MAT_DIALOG_DATA) as { user: any };
  ref = inject(MatDialogRef<AdminFlagDialog>);

  get isAdmin(){ return !!this.data?.user?.officialFlags?.isAdminOfficial; }
  get first(){ return this.data?.user?.firstName || ''; }
  get last(){ return this.data?.user?.lastName || ''; }
  get initials(){
    const f = (this.first?.[0] || '').toUpperCase();
    const l = (this.last?.[0] || '').toUpperCase();
    return (f + l) || (this.data?.user?.email?.[0] || '?').toUpperCase();
  }

  confirm(){ this.ref.close(!this.isAdmin); }  // returns the new value
}
