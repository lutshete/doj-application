import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuditService } from '../../services/audit.service';

type Log = {
  _id?: string;
  actorId?: string;
  action: string;
  createdAt: string | Date;
  target?: { model?: string; id?: string; label?: string };
  metadata?: Record<string, any>;
};

@Component({
  selector: 'app-user-audit-drawer',
  template: `
    <section
      class="dlg"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'auditTitle'"
    >
      <!-- Header -->
      <header class="dlg__hdr">
        <div class="ic" aria-hidden="true">
          <span class="material-icons">list_alt</span>
        </div>
        <div>
          <h3 class="title" id="auditTitle">Audit Trail</h3>
          <div class="sub muted">
            User: <strong>{{ data.email }}</strong>
          </div>
        </div>
      </header>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="field field--search">
          <span class="material-icons">search</span>
          <input
            class="inp"
            placeholder="Search action, target id, label or metadata"
            [(ngModel)]="q"
            (ngModelChange)="applyFilters()"
          />
          <button
            class="clear"
            *ngIf="q"
            (click)="q = ''; applyFilters()"
            aria-label="Clear search"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="field">
          <label>Action</label>
          <select
            class="sel"
            [(ngModel)]="actionFilter"
            (ngModelChange)="applyFilters()"
          >
            <option value="__all">All actions</option>
            <option *ngFor="let a of actionOptions" [value]="a">
              {{ prettyAction(a) }}
            </option>
          </select>
        </div>

        <div class="spacer"></div>

        <button class="btn ghost" title="Refresh" (click)="reload()">
          <span class="material-icons">refresh</span> Refresh
        </button>
        <button class="btn outline" title="Export CSV" (click)="exportCsv()">
          <span class="material-icons">download</span> Export
        </button>
      </div>

      <!-- Content -->
      <div class="dlg__content" [class.loading]="loading">
        <ng-container *ngIf="!loading; else loadingTpl">
          <ng-container *ngIf="groups.length; else emptyTpl">
            <div class="group" *ngFor="let g of groups">
              <div class="group__title">{{ g.label }}</div>

              <div
                class="item"
                *ngFor="let row of g.items; trackBy: trackByLog"
              >
                <div class="time">
                  {{ row.createdAt | date: 'HH:mm' : '+0000' }}
                </div>

                <div class="badge xs" [ngClass]="badgeClass(row.action)">
                  <span class="dot"></span>
                  {{ prettyAction(row.action) }}
                </div>

                <div class="desc">
                  <div class="line">
                    <span class="muted">on</span>
                    <strong>{{ row.target?.model || '—' }}</strong>
                    <code *ngIf="row.target?.id" class="code">{{
                      row.target?.id
                    }}</code>
                    <span *ngIf="row.target?.label" class="muted"
                      >({{ row.target?.label }})</span
                    >
                  </div>

                  <div class="kv" *ngIf="row.metadata && metaKeys(row).length">
                    <span class="chip kv-chip" *ngFor="let k of metaKeys(row)">
                      <b>{{ k }}:</b> {{ showMeta(row.metadata![k]) }}
                    </span>
                  </div>
                </div>

                <div class="acts">
                  <button
                    class="icon-btn"
                    (click)="copy(row.target?.id)"
                    [disabled]="!row.target?.id"
                    title="Copy target id"
                  >
                    <span class="material-icons">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </ng-container>
      </div>

      <!-- Footer -->
      <footer class="dlg__actions">
        <button class="btn outline" (click)="close()">
          <span class="material-icons">close</span>
          Close
        </button>
      </footer>
    </section>

    <!-- Loading -->
    <ng-template #loadingTpl>
      <div class="loading-wrap">
        <div class="spinner"></div>
        <div class="muted">Loading audit logs…</div>
      </div>
    </ng-template>

    <!-- Empty -->
    <ng-template #emptyTpl>
      <div class="empty">
        <span class="material-icons empty__icon">rule_folder</span>
        <div class="empty__title">No audit entries</div>
        <div class="empty__text muted">Try clearing filters or refresh.</div>
      </div>
    </ng-template>
  `,
  styles: [
    `
      /* ===== Shell (same as other dialogs) ===== */
      .dlg {
        width: min(820px, calc(100vw - 40px));
        max-height: min(85vh, 720px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #fff;
        font-family:
          'Poppins',
          system-ui,
          -apple-system,
          Segoe UI,
          Roboto,
          Arial,
          sans-serif;
      }

      /* Header */
      .dlg__hdr {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid #e6e8eb;
        background: #fff;
      }
      .ic {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: #fff;
        border: 1px solid #e6e8eb;
      }
      .ic .material-icons {
        color: #f47f0c;
      }
      .title {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        color: #0b1220;
      }
      .sub {
        font-size: 12px;
        color: #6b7280;
      }

      /* Toolbar */
      .toolbar {
        display: grid;
        grid-template-columns: 1.2fr 0.9fr auto auto;
        gap: 10px;
        padding: 12px 16px;
        border-bottom: 1px solid #f1f2f4;
        background: #fff;
      }
      .field {
        display: grid;
        gap: 6px;
      }
      .field label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 600;
      }
      .field--search {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e6e8eb;
        border-radius: 10px;
        padding: 8px 10px;
        background: #fff;
      }
      .field--search .inp {
        border: none;
        outline: none;
        padding: 0;
        width: 100%;
      }
      .inp,
      .sel {
        padding: 9px 10px;
        border: 1px solid #e6e8eb;
        border-radius: 10px;
        background: #fff;
        font-size: 14px;
      }
      .field--search:focus-within,
      .inp:focus,
      .sel:focus {
        outline: 2px solid rgba(244, 127, 12, 0.35);
        border-color: #f47f0c;
      }
      .clear {
        background: transparent;
        border: none;
        color: #64748b;
        border-radius: 8px;
        cursor: pointer;
      }
      .clear:hover {
        background: #fff7f0;
      }
      .spacer {
        flex: 1;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: none;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn.ghost {
        background: #fff;
        color: #111827;
        border: 1px solid #e6e8eb;
      }
      .btn.outline {
        background: #fff;
        color: #111827;
        border: 1px solid #e6e8eb;
      }
      .btn.outline:hover,
      .btn.ghost:hover {
        border-color: #f47f0c;
      }

      /* Content */
      .dlg__content {
        padding: 0 16px 12px;
        overflow: auto;
      }
      .loading-wrap {
        display: grid;
        place-items: center;
        gap: 10px;
        padding: 24px;
      }
      .spinner {
        width: 22px;
        height: 22px;
        border: 3px solid #e6e8eb;
        border-top-color: #f47f0c;
        border-radius: 50%;
        animation: sp 0.9s linear infinite;
      }
      @keyframes sp {
        to {
          transform: rotate(360deg);
        }
      }
      .dlg__content.loading {
        opacity: 0.65;
        filter: saturate(0.9);
      }

      /* Groups / items */
      .group {
        padding-top: 10px;
      }
      .group__title {
        position: sticky;
        top: 0;
        z-index: 1;
        background: linear-gradient(135deg, #f47f0c, #e76a00);
        color: #fff;
        margin: 0 -16px 6px;
        padding: 6px 16px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .item {
        display: grid;
        grid-template-columns: 64px 160px 1fr 34px;
        gap: 8px;
        align-items: flex-start;
        padding: 10px 0;
        border-bottom: 1px solid #f1f2f4;
      }
      .time {
        font-variant-numeric: tabular-nums;
        color: #6b7280;
        font-size: 12px;
        margin-top: 2px;
      }

      /* Badges & chips */
      .badge.xs {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 6px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 800;
        background: #f3f4f6;
        color: #111827;
      }
      .badge.xs .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #9ca3af;
      }
      .badge.ok {
        background: rgba(40, 167, 69, 0.12);
        color: #28a745;
      }
      .badge.warn {
        background: rgba(255, 193, 7, 0.15);
        color: #b07d00;
      }
      .badge.bad {
        background: rgba(220, 53, 69, 0.12);
        color: #dc3545;
      }
      .badge.info {
        background: rgba(0, 123, 255, 0.12);
        color: #007bff;
      }

      .desc .line {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      .code {
        padding: 0 6px;
        background: #f6f7fb;
        border: 1px solid #e6e8eb;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas,
          'Liberation Mono', monospace;
        font-size: 12px;
      }
      .kv {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 6px;
      }
      .kv-chip {
        background: #fff;
        border: 1px solid #e6e8eb;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 11px;
      }
      .muted {
        color: #6b7280;
      }

      /* Actions */
      .icon-btn {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border: none;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
      }
      .icon-btn:hover {
        background: #fff7f0;
      }
      .material-icons {
        font-size: 18px;
        line-height: 1;
      }

      /* Empty */
      .empty {
        display: grid;
        place-items: center;
        text-align: center;
        gap: 8px;
        padding: 28px;
      }
      .empty__icon {
        font-size: 46px;
        color: #cbd5e1;
      }

      /* Footer */
      .dlg__actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid #e6e8eb;
        background: #fff;
      }
    `,
  ],
})
export class UserAuditDrawer {
  data = inject(MAT_DIALOG_DATA) as { userId: string; email: string };
  ref = inject(MatDialogRef<UserAuditDrawer>);
  svc = inject(AuditService);

  loading = false;
  q = '';
  actionFilter = '__all';

  /** include the common actions you log; extend anytime */
  actionOptions: string[] = [
    'USER_REGISTERED',
    'USER_EMAIL_VERIFIED',
    'USER_LOGIN',
    'PASSWORD_CHANGED',
    'PASSWORD_RESET_REQUESTED',
    'PASSWORD_RESET',
    'OFFICIAL_APPROVED',
    'OFFICIAL_DECLINED',
    'ADMIN_OFFICIAL_FLAG_SET',
    'USER_DEACTIVATED',
    'USER_ACTIVATED',
    'MEETING_CREATED',
    'MEETING_UPDATED',
    'MEETING_INVITE_RESPONDED',
  ];

  logs: Log[] = [];
  filtered: Log[] = [];
  groups: { label: string; items: Log[] }[] = [];

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.svc
      .list({ page: 1, limit: 200, actorId: this.data.userId })
      .subscribe({
        next: (r) => {
          this.logs = (r?.items ?? []) as Log[];
          this.applyFilters();
        },
        error: (_) => {
          this.logs = [];
          this.applyFilters();
        },
        complete: () => (this.loading = false),
      });
  }

  applyFilters() {
    const q = (this.q || '').toLowerCase().trim();
    const act = this.actionFilter;

    this.filtered = this.logs.filter((row) => {
      if (act !== '__all' && row.action !== act) return false;
      if (!q) return true;
      const hay = [
        row.action,
        row.target?.model,
        row.target?.id,
        row.target?.label,
        JSON.stringify(row.metadata || {}),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });

    this.groupByDay();
  }

  groupByDay() {
    // sort newest first
    const sorted = [...this.filtered].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
    const map = new Map<string, Log[]>();
    for (const row of sorted) {
      const d = new Date(row.createdAt);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    this.groups = Array.from(map.entries()).map(([k, items]) => ({
      label: this.dayLabel(new Date(items[0].createdAt)),
      items,
    }));
  }

  dayLabel(d: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - dd.getTime()) / 86400000;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  prettyAction(a?: string) {
    switch (a) {
      case 'USER_REGISTERED':
        return 'User Registered';
      case 'USER_EMAIL_VERIFIED':
        return 'Email Verified';
      case 'USER_LOGIN':
        return 'User Login';
      case 'PASSWORD_CHANGED':
        return 'Password Changed';
      case 'PASSWORD_RESET_REQUESTED':
        return 'Password Reset Requested';
      case 'PASSWORD_RESET':
        return 'Password Reset';
      case 'OFFICIAL_APPROVED':
        return 'Official Approved';
      case 'OFFICIAL_DECLINED':
        return 'Official Declined';
      case 'ADMIN_OFFICIAL_FLAG_SET':
        return 'Admin Flag Set';
      case 'USER_DEACTIVATED':
        return 'User Deactivated';
      case 'USER_ACTIVATED':
        return 'User Activated';
      case 'MEETING_CREATED':
        return 'Meeting Created';
      case 'MEETING_UPDATED':
        return 'Meeting Updated';
      case 'MEETING_INVITE_RESPONDED':
        return 'Meeting Invite Responded';
      default:
        return a || '—';
    }
  }

  badgeClass(a?: string) {
    switch (a) {
      case 'USER_LOGIN':
      case 'PASSWORD_RESET_REQUESTED':
      case 'PASSWORD_RESET':
      case 'ADMIN_OFFICIAL_FLAG_SET':
      case 'MEETING_CREATED':
      case 'MEETING_UPDATED':
      case 'MEETING_INVITE_RESPONDED':
        return 'info';
      case 'USER_ACTIVATED':
      case 'OFFICIAL_APPROVED':
      case 'USER_EMAIL_VERIFIED':
      case 'PASSWORD_CHANGED':
      case 'USER_REGISTERED':
        return 'ok';
      case 'USER_DEACTIVATED':
      case 'OFFICIAL_DECLINED':
        return 'bad';
      default:
        return 'info';
    }
  }

  metaKeys(row: Log) {
    return Object.keys(row.metadata || {}).slice(0, 6);
  }
  showMeta(v: any) {
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  }

  trackByLog = (_: number, r: Log) => r._id || (r.createdAt as any) || r.action;

  copy(text?: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  exportCsv() {
    const rows = this.filtered.map((r) => ({
      createdAt: new Date(r.createdAt).toISOString(),
      action: r.action,
      targetModel: r.target?.model || '',
      targetId: r.target?.id || '',
      targetLabel: r.target?.label || '',
      metadata: JSON.stringify(r.metadata || {}),
    }));
    const header = Object.keys(
      rows[0] || {
        createdAt: '',
        action: '',
        targetModel: '',
        targetId: '',
        targetLabel: '',
        metadata: '',
      },
    );
    const csv = [
      header.join(','),
      ...rows.map((r) =>
        header
          .map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${this.data.userId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  close() {
    this.ref.close();
  }
}
