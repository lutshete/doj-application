import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

type Isoish = string | Date;
interface MeetingIn {
  start: Isoish;
  end: Isoish;
  link?: string;
}

@Component({
  selector: 'app-meeting-editor-dialog',
  template: `
  <section class="dlg" role="dialog" aria-modal="true" [attr.aria-labelledby]="'dlgTitle'">
    <!-- Header -->
    <header class="dlg__hdr ok">
      <div class="ic" aria-hidden="true"><span class="material-icons">event</span></div>
      <div>
        <h3 class="title" id="dlgTitle">{{ isEdit ? 'Update Meeting' : 'Schedule Meeting' }}</h3>
        <div class="sub muted">
          Times shown in <strong>{{ tz }}</strong>
          <span *ngIf="closingDateLocal"> • Window closes: {{ closingDateLocal }}</span>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="dlg__content">
      <div class="grid">
        <!-- Start -->
        <label class="lbl">Start <span class="req">*</span></label>
        <div class="field">
          <span class="prefix"><span class="material-icons">schedule</span></span>
          <input
            type="datetime-local"
            [min]="minStart"
            [value]="start"
            (input)="onStartChange($any($event.target).value)"
            aria-label="Start date and time"
          />
        </div>

        <!-- End -->
        <label class="lbl">End <span class="req">*</span></label>
        <div class="field">
          <span class="prefix"><span class="material-icons">hourglass_bottom</span></span>
          <input
            type="datetime-local"
            [min]="minEnd"
            [value]="end"
            (input)="onEndChange($any($event.target).value)"
            aria-label="End date and time"
          />
        </div>

        <!-- Link / Venue -->
        <label class="lbl">Teams Link / Venue</label>
        <div class="field">
          <span class="prefix"><span class="material-icons">link</span></span>
          <input
            type="text"
            [value]="link"
            (input)="onLinkChange($any($event.target).value)"
            placeholder="https://teams… or room e.g. SALU Building, Boardroom 4A"
            aria-label="Teams link or venue"
          />
        </div>
      </div>

      <!-- Hints / validation -->
      <div class="hints">
        <div class="note">
          <span class="material-icons" aria-hidden="true">info</span>
          Start must be after the <strong>closing date</strong>; end must be after start.
        </div>

        <div class="muted small" *ngIf="durationText">
          Duration: <strong>{{ durationText }}</strong>
        </div>

        <small class="err" *ngIf="error" role="alert">
          <span class="material-icons">error</span> {{ error }}
        </small>
      </div>
    </div>

    <!-- Actions -->
    <footer class="dlg__actions">
      <button class="btn outline" (click)="ref.close()">
        <span class="material-icons">close</span> Cancel
      </button>
      <button class="btn" [disabled]="!isValid" (click)="submit()">
        <span class="material-icons">{{ isEdit ? 'save' : 'check_circle' }}</span>
        {{ isEdit ? 'Update' : 'Save' }}
      </button>
    </footer>
  </section>
  `,
  styles: [`
/* brand tokens */
:host{
  --panel:#fff; --line:#e6e8eb; --muted:#6b7280; --text:#0b1220;
  --brand:#F47F0C; --brand-600:#e76a00; --ring:rgba(244,127,12,.35);
}

/* container */
.dlg{ width:min(560px, calc(100vw - 40px)); max-height:min(82vh, 640px);
      display:flex; flex-direction:column; overflow:hidden; background:#fff; }

/* header */
.dlg__hdr{ display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--line); background:#fff; }
.ic{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background:#fff; border:1px solid var(--line); }
.dlg__hdr .material-icons{ color:#28a745; }
.title{ margin:0; font-size:18px; font-weight:800; color:var(--text); }
.sub{ font-size:12px; color:var(--muted); }

/* content */
.dlg__content{ padding:12px 16px; overflow-y:auto; overflow-x:hidden; flex:1 1 auto; }
.grid{ display:grid; grid-template-columns:1fr; gap:10px; }
.lbl{ font-size:12px; color:var(--muted); font-weight:600; }
.req{ color:#dc3545; }

/* inputs with prefix icon */
.field{ position:relative; display:flex; align-items:center; }
.field input{
  width:100%; padding:10px 10px 10px 36px; border:1px solid var(--line); border-radius:10px; font-size:14px; background:#fff; color:var(--text);
}
.field input:focus{ outline:2px solid var(--ring); border-color:var(--brand); }
.prefix{ position:absolute; left:8px; display:grid; place-items:center; width:22px; height:22px; color:#64748b; }

/* hints */
.hints{ display:grid; gap:8px; margin-top:6px; }
.note{ display:flex; gap:8px; align-items:center; font-size:13px; border:1px solid var(--line); border-radius:10px; padding:8px 10px; background:#fff; }
.note .material-icons{ color:#007bff; }
.err{ display:flex; gap:6px; align-items:center; color:#dc3545; }
.small{ font-size:12px; }

/* actions */
.dlg__actions{ display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid var(--line); background:#fff; }
.btn{ display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border:none; border-radius:10px; font-weight:800; cursor:pointer; background:#F47F0C; color:#fff; }
.btn:hover{ background:#e76a00; }
.btn:disabled{ opacity:.6; cursor:not-allowed; }
.btn.outline{ background:#fff; color:#111827; border:1px solid var(--line); }
.btn.outline:hover{ border-color:var(--brand); }
.material-icons{ font-size:18px; line-height:1; }
  `]
})
export class MeetingEditorDialog {
  ref = inject(MatDialogRef<MeetingEditorDialog>);
  data = inject(MAT_DIALOG_DATA) as { closingDate: string; meeting?: MeetingIn };

  // form (YYYY-MM-DDTHH:mm for datetime-local)
  start = '';
  end = '';
  link = '';

  // constraints / meta
  minStart = '';
  minEnd = '';
  tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Johannesburg';

  // ui state
  error = '';
  isValid = false;

  get isEdit(){ return !!this.data?.meeting; }
  get closingDateLocal(): string {
    const c = new Date(this.data?.closingDate || '');
    return isNaN(+c) ? '' : c.toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' });
  }
  get durationText(): string {
    if (!this.start || !this.end) return '';
    const s = new Date(this.start).getTime();
    const e = new Date(this.end).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return '';
    const mins = Math.round((e - s) / 60000);
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${h ? h + 'h ' : ''}${m ? m + 'm' : (h ? '' : '0m')}`.trim();
  }

  ngOnInit(): void {
    const closing = new Date(this.data?.closingDate || Date.now());
    // minStart: equal to closing; validation will enforce strictly after
    this.minStart = this.toLocalInput(closing);

    const baseStart = this.data?.meeting?.start ? new Date(this.data.meeting.start)
                    : new Date(closing.getTime() + 60 * 60 * 1000);
    const baseEnd   = this.data?.meeting?.end ? new Date(this.data.meeting.end)
                    : new Date(baseStart.getTime() + 60 * 60 * 1000);

    this.start = this.toLocalInput(baseStart);
    this.end   = this.toLocalInput(baseEnd);
    this.minEnd = this.start;

    this.link = this.data?.meeting?.link || '';
    this.validate();
  }

  // input handlers
  onStartChange(v: string) {
    this.start = v;
    if (!this.end || this.end < v) this.end = v; // keep end >= start
    this.minEnd = v;
    this.validate();
  }
  onEndChange(v: string) {
    this.end = v;
    this.validate();
  }
  onLinkChange(v: string) { this.link = v; }

  // helpers
  private toLocalInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private validate(): boolean {
    this.error = '';
    let ok = true;

    const s = new Date(this.start);
    const e = new Date(this.end);
    const c = new Date(this.data?.closingDate || 0);

    if (isNaN(+s) || isNaN(+e)) {
      this.error = 'Start and end are required.';
      ok = false;
    } else if (!(s < e)) {
      this.error = 'End must be after start.';
      ok = false;
    } else if (s <= c) {                           // strictly after closing
      this.error = 'Start must be after the window closing date.';
      ok = false;
    }

    this.isValid = ok;
    return ok;
  }

  submit(): void {
    if (!this.validate()) return;
    this.ref.close({ start: this.start, end: this.end, link: (this.link || '').trim() });
  }
}
