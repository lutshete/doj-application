import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MeetingsService } from 'src/app/services/meetings.service'; // <— NEW

type NoteDialogData = {
  title?: string;
  placeholder?: string;
  initialReviewFlags?: Record<string, boolean>;
  windowId?: string; // <— NEW
  dateFrom?: string;
  dateTo?: string;
};

// Minimal meeting shape for UI
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
  selector: 'app-note-dialog',
  imports: [CommonModule, FormsModule],
  template: `
    <section
      class="dlg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="noteDlgTitle"
    >
      <!-- Header -->
      <header class="dlg__hdr ok">
        <div class="ic" aria-hidden="true">
          <span class="material-icons">note_add</span>
        </div>
        <div>
          <h3 class="title" id="noteDlgTitle">
            {{ data?.title || 'Add Note' }}
          </h3>
          <div class="sub muted">
            Add an optional note and meeting ID. Use the chips to mark required
            items as OK.
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="dlg__content">
        <div class="grid">
          <!-- Note -->
          <label class="lbl">{{ data?.placeholder || 'Note' }}</label>
          <div class="field ta">
            <span class="prefix"
              ><span class="material-icons">notes</span></span
            >
            <textarea
              rows="3"
              [(ngModel)]="text"
              aria-label="Note"
              placeholder="Write your note…"
            ></textarea>
          </div>

          <!-- Meeting (picker + manual) -->
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
  >
    <span class="material-icons">refresh</span> Reload
  </button>
</div>

<div
  class="sub muted"
  *ngIf="!loadingMeetings && data?.windowId && !meetings.length"
>
  No meetings found for this window in the selected range.
</div>
<div class="sub muted" *ngIf="meetingsError">{{ meetingsError }}</div>


          <!-- Quick chips (selected = OK) -->
          <label class="lbl">Quick review (tap to mark OK)</label>
          <div class="quick">
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.id_document"
              (click)="toggle('id_document')"
            >
              ID Document
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.qualification"
              (click)="toggle('qualification')"
            >
              Qualification
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.membership"
              (click)="toggle('membership')"
            >
              Membership
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.tax_clearance"
              (click)="toggle('tax_clearance')"
            >
              Tax Clearance
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.bond_facility"
              (click)="toggle('bond_facility')"
            >
              Bond Facility
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.bank_docs"
              (click)="toggle('bank_docs')"
            >
              Bank Docs
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.lease_agreement"
              (click)="toggle('lease_agreement')"
            >
              Lease Agreement
            </button>
            <button
              type="button"
              class="chip-select"
              [class.active]="flags.appointments"
              (click)="toggle('appointments')"
            >
              Appointments
            </button>
          </div>

          <!-- Status summary -->
          <div class="status" [class.ok]="allOk" [class.bad]="!allOk">
            <span class="material-icons" aria-hidden="true">{{
              allOk ? 'check_circle' : 'error'
            }}</span>
            <ng-container *ngIf="allOk; else missingTpl"
              >All required documents detected.</ng-container
            >
            <ng-template #missingTpl>
              Missing/Not OK:
              <span class="miss" *ngFor="let k of missingList">{{
                labelMap[k]
              }}</span>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <footer class="dlg__actions">
        <button class="btn outline" (click)="ref.close()">
          <span class="material-icons">close</span> Cancel
        </button>
        <button class="btn" (click)="save()">
          <span class="material-icons">check_circle</span> Save
        </button>
      </footer>
    </section>
  `,
  styles: [
    `
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
      }
      .dlg {
        width: min(560px, calc(100vw - 40px));
        max-height: min(82vh, 640px);
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
      .dlg__hdr .material-icons {
        color: var(--ok);
      }
      .title {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        color: var(--text);
      }
      .sub {
        font-size: 12px;
        color: var(--muted);
      }
      .dlg__content {
        padding: 12px 16px;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1 1 auto;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .lbl {
        font-size: 12px;
        color: var(--muted);
        font-weight: 600;
      }
      .field {
        position: relative;
        display: flex;
        align-items: center;
      }
      .field.ta {
        align-items: start;
      }
      .field textarea,
      .field input,
      .field select {
        width: 100%;
        padding: 10px 10px 10px 36px;
        border: 1px solid var(--line);
        border-radius: 10px;
        font-size: 14px;
        background: #fff;
        color: var(--text);
      }
      .field textarea {
        resize: vertical;
      }
      .field textarea:focus,
      .field input:focus,
      .field select:focus {
        outline: 2px solid var(--ring);
        border-color: var(--brand);
      }
      .prefix {
        position: absolute;
        left: 8px;
        top: 9px;
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        color: #64748b;
      }
      .quick {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .chip-select {
        padding: 6px 10px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: #fff;
        cursor: pointer;
        font-weight: 700;
        font-size: 12px;
      }
      .chip-select.active {
        border-color: var(--ok);
        background: rgba(40, 167, 69, 0.08);
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 8px 10px;
        background: #fff;
      }
      .status.ok {
        color: var(--ok);
        border-color: rgba(40, 167, 69, 0.35);
      }
      .status.bad {
        color: #b07d00;
        border-color: rgba(255, 193, 7, 0.45);
      }
      .miss {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        margin-left: 6px;
        border-radius: 999px;
        background: #fff7e6;
        border: 1px solid #ffe1a1;
        color: #8a5a00;
        font-size: 12px;
        font-weight: 700;
      }
      .dlg__actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--line);
        background: #fff;
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
        background: #f47f0c;
        color: #fff;
      }
      .btn:hover {
        background: #e76a00;
      }
      .btn.outline {
        background: #fff;
        color: #111827;
        border: 1px solid var(--line);
      }
      .btn.outline:hover {
        border-color: var(--brand);
      }
      .btn.xs {
        padding: 6px 8px;
        font-size: 12px;
      }
      .ml8 {
        margin-left: 8px;
      }
      .material-icons {
        font-size: 18px;
        line-height: 1;
      }
    `,
  ],
})
export class NoteDialogComponent implements OnInit {
  ref = inject(MatDialogRef<NoteDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as NoteDialogData;
  private meetingsSvc = inject(MeetingsService); // <— NEW

  text = '';
  meetingId = '';

  // Meetings UI state
  meetings: UIMeeting[] = [];
  loadingMeetings = false;
  meetingsError = '';

  /** Boolean flags: selected = OK */
  flags: Record<string, boolean> = {
    id_document: false,
    qualification: false,
    membership: false,
    tax_clearance: false,
    bond_facility: false,
    bank_docs: false,
    lease_agreement: false,
    appointments: false,
  };

  /** Labels for display + summary */
  labelMap: Record<keyof NoteDialogComponent['flags'], string> = {
    id_document: 'ID Document',
    qualification: 'Qualification',
    membership: 'Membership',
    tax_clearance: 'Tax Clearance',
    bond_facility: 'Bond Facility',
    bank_docs: 'Bank Docs',
    lease_agreement: 'Lease Agreement',
    appointments: 'Appointments',
  };

  allOk = false;
  missingList: (keyof NoteDialogComponent['flags'])[] = [];

  ngOnInit(): void {
    if (this.data?.initialReviewFlags) {
      this.flags = { ...this.flags, ...this.data.initialReviewFlags };
    }
    this.computeStatus();

    // Load meetings for the window (if provided)
    if (this.data?.windowId) this.reloadMeetings();
  }

  // ===== Meetings helpers =====
  reloadMeetings(): void {
    if (!this.data?.windowId) return;
    this.loadingMeetings = true;
    this.meetingsError = '';

    const now = new Date();
    const defaultFrom = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString(); // last 30d
    const defaultTo = new Date(
      now.getTime() + 180 * 24 * 60 * 60 * 1000,
    ).toISOString(); // next 6mo

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
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(start)
      : 'No date';
    const where = m.venue || m.link || '';
    const title = m.title || 'Meeting';
    return [title, when, where].filter(Boolean).join(' • ');
  }

  onSelectMeeting(id: string) {
    this.meetingId = id || '';
  }

  // ===== Quick review chips =====
  toggle(k: keyof NoteDialogComponent['flags']) {
    this.flags[k] = !this.flags[k];
    this.computeStatus();
  }

  private computeStatus(): void {
    const keys = Object.keys(
      this.flags,
    ) as (keyof NoteDialogComponent['flags'])[];
    this.missingList = keys.filter((k) => !this.flags[k]);
    this.allOk = this.missingList.length === 0;
  }

  private defaultNote(): string {
    if (this.allOk)
      return 'Pre-review: All required documents detected. Marking application UNDER REVIEW.';
    const missing = this.missingList.map((k) => this.labelMap[k]).join(', ');
    return `Pre-review: Missing/Not OK → ${missing}. Marking application UNDER REVIEW with conditions.`;
  }

save(): void {
  const comment = (this.text || '').trim() || this.defaultNote();

  const annex = {
    review_flags: this.flags,
    all_ok: this.allOk,
    missing: this.missingList,
  };

  this.ref.close({
    // match API body names directly
    text: comment,           // ← kept for existing afterClosed() mapper
    meetingId: (this.meetingId || '').trim() || undefined,
    annex,
  });
}

}
