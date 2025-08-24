import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MeetingsService } from 'src/app/services/meetings.service';

type ApproveDialogData = {
  windowId?: string;
  dateFrom?: string; // optional filter range
  dateTo?: string;
};

type UIMeeting = {
  _id?: string;
  id?: string;
  start?: string;
  end?: string;
  venue?: string;
  link?: string;
  title?: string;
};

@Component({
  standalone: true,
  selector: 'app-approve-dialog',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="dlg" role="dialog" aria-modal="true" aria-labelledby="approveTitle">
      <!-- Header -->
      <header class="dlg__hdr ok">
        <div class="ic" aria-hidden="true">
          <span class="material-icons">thumb_up</span>
        </div>
        <div>
          <h3 class="title" id="approveTitle">Approve Application</h3>
          <div class="sub muted">Add an optional note and (optionally) link a meeting.</div>
        </div>
      </header>

      <!-- Content -->
      <div class="dlg__content">
        <div class="grid">
          <!-- Comment -->
          <label class="lbl">Comment</label>
          <div class="field ta">
            <span class="prefix"><span class="material-icons">notes</span></span>
            <textarea
              rows="3"
              [(ngModel)]="comment"
              placeholder="Optional approval note"
              aria-label="Approval comment"
            ></textarea>
          </div>

          <!-- Meeting (picker + reload) -->
          <label class="lbl">Meeting (optional)</label>
          <div class="field">
            <span class="prefix"><span class="material-icons">event</span></span>

            <select
              class="sel"
              [disabled]="loadingMeetings || !data?.windowId"
              [(ngModel)]="meetingId"
              (ngModelChange)="onSelectMeeting($event)"
              aria-label="Meeting"
            >
              <option [ngValue]="''">
                {{
                  loadingMeetings
                    ? 'Loading meetings…'
                    : !data?.windowId
                      ? 'No window provided'
                      : '— Select meeting —'
                }}
              </option>

              <option *ngFor="let m of meetings" [ngValue]="meetingIdOf(m)">
                {{ formatMeeting(m) }}
              </option>
            </select>

            <button
              type="button"
              class="btn xs outline ml8"
              *ngIf="data?.windowId"
              (click)="reloadMeetings()"
              [disabled]="loadingMeetings"
              [attr.aria-busy]="loadingMeetings"
              title="Reload meetings"
            >
              <span class="material-icons">refresh</span>
              <span class="hide-sm">Reload</span>
            </button>
          </div>

          <div class="sub muted" *ngIf="!loadingMeetings && data?.windowId && !meetings.length">
            No meetings found for this window in the selected range.
          </div>
          <div class="sub muted" *ngIf="meetingsError" role="alert">{{ meetingsError }}</div>
        </div>
      </div>

      <!-- Actions -->
      <footer class="dlg__actions">
        <button class="btn outline" (click)="ref.close()">
          <span class="material-icons">close</span> Cancel
        </button>
        <button class="btn" (click)="save()">
          <span class="material-icons">check_circle</span> Approve
        </button>
      </footer>
    </section>
  `,
  styles: [`
    :host {
      --panel: #fff;
      --line: #e6e8eb;
      --muted: #6b7280;
      --text: #0b1220;
      --brand: #f47f0c;
      --brand-600: #e76a00;
      --ring: rgba(244, 127, 12, 0.35);
      --ok: #28a745;
      --info: #007bff;
      display: block;
    }
    /* Make our dialog take full control of layout/scrolling */
    :host ::ng-deep .dlg--flush .mat-mdc-dialog-surface {
      padding: 0 !important;
      overflow: hidden !important;
    }
    .dlg {
      width: min(570px, calc(100vw - 40px));
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
      border-radius: 12px;
    }
    .dlg__hdr {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
      background: #fff;
      flex: 0 0 auto;
    }
    .ic {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: #fff;
      border: 1px solid var(--line);
    }
    .dlg__hdr .material-icons { color: var(--ok); }
    .title { margin: 0; font-size: 18px; font-weight: 800; color: var(--text); }
    .sub { font-size: 12px; color: var(--muted); }
    .dlg__content {
      padding: 12px 16px;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      flex: 1 1 auto;
    }
    .grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
    .lbl { font-size: 12px; color: var(--muted); font-weight: 600; }
    .field { position: relative; display: flex; align-items: center; }
    .field.ta { align-items: start; }
    .field textarea, .field input, .field select {
      width: 100%;
      padding: 10px 10px 10px 36px;
      border: 1px solid var(--line);
      border-radius: 10px;
      font-size: 14px;
      background: #fff;
      color: var(--text);
    }
    .field textarea { resize: vertical; min-height: 84px; }
    .field textarea:focus, .field input:focus, .field select:focus {
      outline: 2px solid var(--ring);
      border-color: var(--brand);
    }
    .prefix {
      position: absolute; left: 8px; top: 9px;
      display: grid; place-items: center;
      width: 22px; height: 22px; color: #64748b;
    }
    .dlg__actions {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 16px; border-top: 1px solid var(--line); background: #fff;
      flex: 0 0 auto;
    }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 12px; border: none; border-radius: 10px;
      font-weight: 800; cursor: pointer; background: var(--brand); color: #fff;
    }
    .btn:hover { background: var(--brand-600); }
    .btn.outline { background: #fff; color: #111827; border: 1px solid var(--line); }
    .btn.outline:hover { border-color: var(--brand); }
    .btn.xs { padding: 6px 8px; font-size: 12px; }
    .ml8 { margin-left: 8px; }
    .material-icons { font-size: 18px; line-height: 1; }
    .hide-sm { display: none; }
    @media (min-width: 480px) { .hide-sm { display: inline; } }
  `],
})
export class ApproveDialogComponent implements OnInit {
  ref = inject(MatDialogRef<ApproveDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as ApproveDialogData;
  private meetingsSvc = inject(MeetingsService);

  comment = '';
  meetingId = '';

  meetings: UIMeeting[] = [];
  loadingMeetings = false;
  meetingsError = '';

  ngOnInit(): void {
    if (this.data?.windowId) this.reloadMeetings();
  }

  // ===== Meetings helpers =====
  reloadMeetings(): void {
    if (!this.data?.windowId) return;
    this.loadingMeetings = true;
    this.meetingsError = '';

    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const defaultTo = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const from = this.data?.dateFrom || defaultFrom;
    const to = this.data?.dateTo || defaultTo;

    this.meetingsSvc.listForWindow(this.data.windowId, from, to).subscribe({
      next: (list: any[]) => {
        this.meetings = list || [];
        this.loadingMeetings = false;
      },
      error: (e) => {
        this.meetingsError = e?.error?.message || 'Failed to load meetings.';
        this.loadingMeetings = false;
      },
    });
  }

  meetingIdOf(m: UIMeeting): string {
    return m.id || m._id || '';
  }

  formatMeeting(m: UIMeeting): string {
    const start = m.start ? new Date(m.start) : undefined;
    const when = start
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(start)
      : 'No date';
    const where = m.venue || m.link || '';
    const title = m.title || 'Meeting';
    return [title, when, where].filter(Boolean).join(' • ');
  }

  onSelectMeeting(id: string) {
    this.meetingId = id || '';
  }

  // ===== Submit =====
  save(): void {
    this.ref.close({
      comment: this.comment?.trim() || undefined,
      meetingId: this.meetingId?.trim() || undefined, // optional
      // (no annex)
    });
  }
}
