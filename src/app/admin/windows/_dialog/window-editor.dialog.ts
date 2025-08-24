import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

type IsoDate = string; // "YYYY-MM-DD"

@Component({
  selector: 'app-window-editor-dialog',
  template: `
  <section class="dlg" role="dialog" aria-modal="true" [attr.aria-labelledby]="'dlgTitle'">
    <!-- Header -->
    <header class="dlg__hdr">
      <div class="ic" aria-hidden="true">
        <span class="material-icons">{{ isCreate ? 'event_available' : 'event_repeat' }}</span>
      </div>
      <div>
        <h3 class="title" id="dlgTitle">{{ isCreate ? 'Create Window' : 'Extend Closing Date' }}</h3>
        <div class="sub muted">
          <ng-container *ngIf="isCreate; else extendHelp">
            Closing must be <strong>4–5 weeks</strong> after opening (28–35 days).
          </ng-container>
          <ng-template #extendHelp>
            You may extend the current closing date by <strong>up to 7 days</strong>.
          </ng-template>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="dlg__content">
      <div class="grid">
        <!-- Opening -->
        <label class="lbl">Opening Date <span class="req" *ngIf="isCreate">*</span></label>
        <div class="field">
          <span class="prefix"><span class="material-icons">calendar_today</span></span>
          <input
            type="date"
            [value]="opening"
            (input)="onOpeningChange($any($event.target).value)"
            [disabled]="!isCreate"
            aria-label="Opening date"
          />
        </div>

        <!-- Closing -->
        <label class="lbl">Closing Date <span class="req">*</span></label>
        <div class="field">
          <span class="prefix"><span class="material-icons">event_busy</span></span>
          <input
            type="date"
            [value]="closing"
            (input)="onClosingChange($any($event.target).value)"
            [min]="minClosing"
            [max]="maxClosing"
            aria-label="Closing date"
          />
        </div>

        <!-- Quick actions -->
        <div class="quick" *ngIf="isCreate">
          <button type="button" class="chip-select" (click)="applyWeeks(4)">+ 4 weeks</button>
          <button type="button" class="chip-select" (click)="applyWeeks(5)">+ 5 weeks</button>
          <button type="button" class="chip-select ghost" (click)="resetToDefaults()">Reset</button>
        </div>
        <div class="quick" *ngIf="!isCreate">
          <button type="button" class="chip-select" (click)="applyDays(3)">+ 3 days</button>
          <button type="button" class="chip-select" (click)="applyDays(7)">+ 7 days</button>
          <button type="button" class="chip-select ghost" (click)="resetToDefaults()">Reset</button>
        </div>

        <!-- Live summary -->
        <div class="summary" *ngIf="summaryText">
          <span class="material-icons">schedule</span>
          <span [innerHTML]="summaryText"></span>
        </div>

        <!-- Hint / error -->
        <div class="hints">
          <small class="err" *ngIf="error" role="alert">
            <span class="material-icons">error</span> {{ error }}
          </small>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <footer class="dlg__actions">
      <button class="btn outline" (click)="ref.close()"><span class="material-icons">close</span>Cancel</button>
      <button class="btn" [disabled]="!isValid" (click)="submit()">
        <span class="material-icons">check_circle</span> Save
      </button>
    </footer>
  </section>
  `,
  styles: [`
:host{
  --panel:#fff; --line:#e6e8eb; --muted:#6b7280; --text:#0b1220;
  --brand:#F47F0C; --brand-600:#e76a00; --ring:rgba(244,127,12,.35);
}

/* container */
.dlg{ width:min(560px, calc(100vw - 40px)); max-height:min(82vh, 640px);
      display:flex; flex-direction:column; overflow:hidden; background:#fff; }

/* header */
.dlg__hdr{ display:flex; align-items:center; gap:12px; padding:12px 16px;
           border-bottom:1px solid var(--line); background:#fff; }
.ic{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
     background:#fff; border:1px solid var(--line); }
.ic .material-icons{ color:#28a745; }
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
  width:100%; padding:10px 10px 10px 36px; border:1px solid var(--line);
  border-radius:10px; font-size:14px; background:#fff; color:var(--text);
}
.field input:focus{ outline:2px solid var(--ring); border-color:var(--brand); }
.prefix{ position:absolute; left:8px; display:grid; place-items:center; width:22px; height:22px; color:#64748b; }

/* quick actions */
.quick{ display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
.chip-select{
  padding:6px 10px; border:1px solid var(--line); border-radius:999px; background:#fff;
  cursor:pointer; font-weight:700; font-size:12px;
}
.chip-select:hover{ border-color:#f47f0c33; background:#fff7f0; }
.chip-select.ghost{ color:#374151; }

/* live summary */
.summary{ display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px dashed var(--line);
          border-radius:10px; font-size:13px; background:#fff; color:#111827; }
.summary .material-icons{ color:#007bff; }

/* hints */
.hints{ display:grid; gap:8px; margin-top:4px; }
.err{ display:flex; gap:6px; align-items:center; color:#dc3545; }

/* actions */
.dlg__actions{ display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid var(--line); background:#fff; }
.btn{ display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border:none; border-radius:10px; font-weight:800; cursor:pointer;
      background:#F47F0C; color:#fff; }
.btn:hover{ background:#e76a00; }
.btn:disabled{ opacity:.6; cursor:not-allowed; }
.btn.outline{ background:#fff; color:#111827; border:1px solid var(--line); }
.btn.outline:hover{ border-color:var(--brand); }
.material-icons{ font-size:18px; line-height:1; }
  `]
})
export class WindowEditorDialog {
  ref = inject(MatDialogRef<WindowEditorDialog>);
  data = inject(MAT_DIALOG_DATA) as { current?: { openingDate: string; closingDate: string } };

  opening: IsoDate = this.data?.current?.openingDate?.slice(0,10) || '';
  closing: IsoDate = this.data?.current?.closingDate?.slice(0,10) || '';

  minClosing: IsoDate = '';
  maxClosing: IsoDate = '';
  error = '';
  isValid = false;

  get isCreate(){ return !this.data?.current; }

  ngOnInit(): void {
    if (this.isCreate) {
      if (!this.opening) this.opening = this.toInputDate(new Date());
      if (!this.closing) this.closing = this.addDays(this.opening, 28);
      // Constraints: [opening+28, opening+35]
      this.minClosing = this.addDays(this.opening, 28);
      this.maxClosing = this.addDays(this.opening, 35);
    } else {
      const prevClosing = this.data.current!.closingDate.slice(0,10);
      if (!this.opening) this.opening = this.data.current!.openingDate.slice(0,10);
      if (!this.closing || this.closing < prevClosing) this.closing = prevClosing;
      // Constraints: (prevClosing, prevClosing+7]
      this.minClosing = this.addDays(prevClosing, 1);
      this.maxClosing = this.addDays(prevClosing, 7);
    }
    this.validate();
  }

  // Handlers
  onOpeningChange(v: IsoDate) {
    this.opening = v;
    if (this.isCreate) {
      this.minClosing = this.addDays(v, 28);
      this.maxClosing = this.addDays(v, 35);
      if (this.closing < this.minClosing) this.closing = this.minClosing;
      if (this.closing > this.maxClosing) this.closing = this.maxClosing;
    }
    this.validate();
  }
  onClosingChange(v: IsoDate) {
    this.closing = v;
    this.validate();
  }

  // Quick actions
  applyWeeks(w: 4 | 5) {
    if (!this.opening) return;
    const d = this.addDays(this.opening, w * 7);
    this.closing = this.clamp(d, this.minClosing, this.maxClosing);
    this.validate();
  }
  applyDays(days: 3 | 7) {
    if (!this.closing) return;
    const d = this.addDays(this.data.current!.closingDate.slice(0,10), days);
    this.closing = this.clamp(d, this.minClosing, this.maxClosing);
    this.validate();
  }
  resetToDefaults() {
    if (this.isCreate) {
      this.closing = this.addDays(this.opening, 28);
    } else {
      const prevC = this.data.current!.closingDate.slice(0,10);
      this.closing = prevC;
    }
    this.validate();
  }

  // Derived text
  get summaryText(): string {
    if (!this.opening || !this.closing) return '';
    if (this.isCreate) {
      const days = this.diffDays(this.opening, this.closing);
      return days >= 0 ? `Window length: <strong>${days} day(s)</strong>` : '';
    } else {
      const base = this.data.current!.closingDate.slice(0,10);
      const days = this.diffDays(base, this.closing);
      return days > 0 ? `Extending by <strong>${days} day(s)</strong>` : 'No extension';
    }
  }

  // Validation
  private validate(): boolean {
    this.error = '';
    let ok = true;

    if (!this.opening || !this.closing) {
      this.error = 'Both opening and closing dates are required.';
      ok = false;
    } else if (this.isCreate) {
      const days = this.diffDays(this.opening, this.closing);
      if (days < 28 || days > 35) {
        this.error = 'Closing must be 4–5 weeks after opening (28–35 days).';
        ok = false;
      }
      if (!(this.opening < this.closing)) {
        this.error = 'Opening must be before closing.';
        ok = false;
      }
    } else {
      const base = this.data.current!.closingDate.slice(0,10);
      const days = this.diffDays(base, this.closing);
      if (this.closing <= base) {
        this.error = 'New closing must be after current closing.';
        ok = false;
      } else if (days > 7) {
        this.error = 'Extension limited to 1 week max.';
        ok = false;
      }
    }

    if (this.minClosing && this.closing < this.minClosing) { this.error = 'Closing date is too soon.'; ok = false; }
    if (this.maxClosing && this.closing > this.maxClosing) { this.error = 'Closing date exceeds allowed range.'; ok = false; }

    this.isValid = ok;
    return ok;
  }

  // Submit
  submit() {
    if (!this.validate()) return;
    if (this.isCreate) {
      this.ref.close({ opening: this.opening, closing: this.closing });
    } else {
      this.ref.close({ closing: this.closing });
    }
  }

  // --- utils ---
  private toInputDate(d: Date): IsoDate {
    const pad = (n: number) => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    }
  private addDays(dateStr: IsoDate, days: number): IsoDate {
    const d = new Date(dateStr as string);
    d.setDate(d.getDate() + days);
    return this.toInputDate(d);
  }
  private diffDays(startStr: IsoDate, endStr: IsoDate): number {
    const a = new Date(startStr as string); a.setHours(12,0,0,0);
    const b = new Date(endStr as string);   b.setHours(12,0,0,0);
    return Math.round((+b - +a) / 86400000);
  }
  private clamp(val: IsoDate, min?: IsoDate, max?: IsoDate): IsoDate {
    if (min && val < min) return min;
    if (max && val > max) return max;
    return val;
  }
}
