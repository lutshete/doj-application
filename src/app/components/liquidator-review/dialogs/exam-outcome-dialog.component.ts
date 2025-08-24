import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-exam-outcome-dialog',
  imports: [CommonModule, FormsModule],
  template: `
  <section class="dlg" role="dialog" aria-modal="true" aria-labelledby="examTitle">
    <!-- Header -->
    <header class="dlg__hdr ok">
      <div class="ic" aria-hidden="true"><span class="material-icons">assignment_turned_in</span></div>
      <div>
        <h3 class="title" id="examTitle">Record Exam Outcome</h3>
        <div class="sub muted">Capture PASS/FAIL, score, sitting date/time, and any notes.</div>
      </div>
    </header>

    <!-- Content -->
    <div class="dlg__content">
      <div class="grid">
        <!-- Outcome -->
        <label class="lbl">Outcome <span class="req">*</span></label>
        <div class="field">
          <span class="prefix"><span class="material-icons">flag</span></span>
          <select [(ngModel)]="outcome" (change)="validate()" aria-label="Outcome">
            <option value="">Select…</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
          </select>
        </div>

        <!-- Score -->
        <label class="lbl">Score (optional)</label>
        <div class="field">
          <span class="prefix"><span class="material-icons">percent</span></span>
          <input type="number" [(ngModel)]="score" (input)="validate()" placeholder="e.g. 74"
                 aria-label="Score" />
        </div>

        <!-- Sat At -->
        <label class="lbl">Sat At (optional)</label>
        <div class="field">
          <span class="prefix"><span class="material-icons">schedule</span></span>
          <input type="datetime-local" [(ngModel)]="satAt" aria-label="Sat at" />
        </div>

        <!-- Invite Token -->
        <label class="lbl">Invite Token (optional)</label>
        <div class="field">
          <span class="prefix"><span class="material-icons">vpn_key</span></span>
          <input type="text" [(ngModel)]="inviteToken" aria-label="Invite token" />
        </div>

        <!-- Notes -->
        <label class="lbl">Notes (optional)</label>
        <div class="field ta">
          <span class="prefix"><span class="material-icons">notes</span></span>
          <textarea rows="4" [(ngModel)]="notes" aria-label="Notes"
                    placeholder="Any context about the exam outcome"></textarea>
        </div>
      </div>

      <!-- Hints / validation -->
      <div class="hints">
        <div class="note">
          <span class="material-icons" aria-hidden="true">info</span>
          Outcome is required. Score (if entered) must be a number between <strong>0–100</strong>.
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
      <button class="btn" [disabled]="!isValid" (click)="save()">
        <span class="material-icons">check_circle</span> Save
      </button>
    </footer>
  </section>
  `,
  styles: [`
/* brand tokens (match MeetingEditorDialog) */
:host{
  --panel:#fff; --line:#e6e8eb; --muted:#6b7280; --text:#0b1220;
  --brand:#F47F0C; --brand-600:#e76a00; --ring:rgba(244,127,12,.35);
  --ok:#28a745; --info:#007bff;
}

/* container */
.dlg{
  width:min(560px, calc(100vw - 40px));
  max-height:min(82vh, 640px);
  display:flex; flex-direction:column;
  overflow:hidden; background:#fff; border-radius:12px;
}

/* header */
.dlg__hdr{
  display:flex; align-items:center; gap:12px;
  padding:12px 16px; border-bottom:1px solid var(--line); background:#fff;
}
.ic{ width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
     background:#fff; border:1px solid var(--line); }
.dlg__hdr .material-icons{ color: var(--ok); }
.title{ margin:0; font-size:18px; font-weight:800; color:var(--text); }
.sub{ font-size:12px; color:var(--muted); }

/* content */
.dlg__content{ padding:12px 16px; overflow-y:auto; overflow-x:hidden; flex:1 1 auto; }
.grid{ display:grid; grid-template-columns:1fr; gap:10px; }
.lbl{ font-size:12px; color:var(--muted); font-weight:600; }
.req{ color:#dc3545; }

/* inputs with prefix icon */
.field{ position:relative; display:flex; align-items:center; }
.field.ta{ align-items:start; }
.field textarea,
.field input,
.field select{
  width:100%;
  padding:10px 10px 10px 36px;
  border:1px solid var(--line);
  border-radius:10px;
  font-size:14px; background:#fff; color:var(--text);
}
.field textarea{ resize:vertical; }
.field textarea:focus,
.field input:focus,
.field select:focus{ outline:2px solid var(--ring); border-color:var(--brand); }
.prefix{ position:absolute; left:8px; top:9px; display:grid; place-items:center;
         width:22px; height:22px; color:#64748b; }

/* hints */
.hints{ display:grid; gap:8px; margin-top:6px; }
.note{ display:flex; gap:8px; align-items:center; font-size:13px;
       border:1px solid var(--line); border-radius:10px; padding:8px 10px; background:#fff; }
.note .material-icons{ color: var(--info); }
.err{ display:flex; gap:6px; align-items:center; color:#dc3545; }

/* actions */
.dlg__actions{
  display:flex; justify-content:flex-end; gap:8px;
  padding:12px 16px; border-top:1px solid var(--line); background:#fff;
}
.btn{
  display:inline-flex; align-items:center; gap:6px;
  padding:8px 12px; border:none; border-radius:10px; font-weight:800;
  cursor:pointer; background:var(--brand); color:#fff;
}
.btn:hover{ background:var(--brand-600); }
.btn:disabled{ opacity:.6; cursor:not-allowed; }
.btn.outline{ background:#fff; color:#111827; border:1px solid var(--line); }
.btn.outline:hover{ border-color:var(--brand); }
.material-icons{ font-size:18px; line-height:1; }
  `]
})
export class ExamOutcomeDialogComponent {
  ref = inject(MatDialogRef<ExamOutcomeDialogComponent>);

  outcome = '';
  score: number | null = null;
  satAt = '';       // datetime-local string
  inviteToken = '';
  notes = '';

  error = '';
  isValid = false;

  ngOnInit(){ this.validate(); }

  private isScoreValid(): boolean {
    if (this.score === null || this.score === undefined || this.score === ('' as any)) return true; // optional
    const n = Number(this.score);
    return Number.isFinite(n) && n >= 0 && n <= 100;
  }

  validate(): void {
    this.error = '';
    if (!this.outcome) {
      this.error = 'Please select an outcome.';
    } else if (!this.isScoreValid()) {
      this.error = 'Score must be a number between 0 and 100.';
    }
    this.isValid = !this.error;
  }

  save(): void {
    this.validate();
    if (!this.isValid) return;

    this.ref.close({
      outcome: this.outcome,
      score: this.score === null || this.score === ('' as any) ? undefined : Number(this.score),
      satAt: this.satAt || undefined,
      notes: (this.notes || '').trim() || undefined,
      inviteToken: (this.inviteToken || '').trim() || undefined
    });
  }
}
