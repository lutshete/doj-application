import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-reject-dialog',
  imports: [CommonModule, FormsModule],
  template: `
  <section class="dlg" role="dialog" aria-modal="true" aria-labelledby="rejectDlgTitle">
    <!-- Header -->
    <header class="dlg__hdr bad">
      <div class="ic" aria-hidden="true"><span class="material-icons">thumb_down</span></div>
      <div>
        <h3 class="title" id="rejectDlgTitle">Reject Application</h3>
        <div class="sub muted">Provide a reason. You can optionally add a meeting ID and ANNEX JSON.</div>
      </div>
    </header>

    <!-- Content -->
    <div class="dlg__content">
      <div class="grid">
        <!-- Reason -->
        <label class="lbl">Reason <span class="req">*</span></label>
        <div class="field ta">
          <span class="prefix"><span class="material-icons">report</span></span>
          <textarea rows="4" [(ngModel)]="reason" aria-label="Rejection reason"
                    placeholder="Provide rejection reason…" (input)="clearErrors()"></textarea>
        </div>

        <!-- Meeting ID -->
        <label class="lbl">Meeting ID (optional)</label>
        <div class="field">
          <span class="prefix"><span class="material-icons">event</span></span>
          <input type="text" [(ngModel)]="meetingId" aria-label="Meeting ID" placeholder="e.g. FINCOM-2025-09-12"/>
        </div>

        <!-- ANNEX -->
        <label class="lbl">ANNEX (JSON, optional)</label>
        <div class="field ta">
          <span class="prefix"><span class="material-icons">data_object</span></span>
          <textarea rows="4" [(ngModel)]="annex" aria-label="Annex JSON"
                    placeholder='{"field":"value"}' (input)="clearErrorsIfJsonFixed()"></textarea>
        </div>
      </div>

      <!-- Hints / validation -->
      <div class="hints">
        <div class="note">
          <span class="material-icons" aria-hidden="true">info</span>
          Reason is required. If provided, ANNEX must be <strong>valid JSON</strong>.
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
      <button class="btn" [disabled]="!reason.trim()" (click)="save()">
        <span class="material-icons">thumb_down</span> Reject
      </button>
    </footer>
  </section>
  `,
  styles: [`
/* brand tokens */
:host{
  --panel:#fff; --line:#e6e8eb; --muted:#6b7280; --text:#0b1220;
  --brand:#F47F0C; --brand-600:#e76a00; --ring:rgba(244,127,12,.35);
  --ok:#28a745; --bad:#dc3545; --info:#007bff;
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
.dlg__hdr.bad .material-icons{ color: var(--bad); }
.title{ margin:0; font-size:18px; font-weight:800; color:var(--text); }
.sub{ font-size:12px; color:var(--muted); }

/* content */
.dlg__content{ padding:12px 16px; overflow-y:auto; overflow-x:hidden; flex:1 1 auto; }
.grid{ display:grid; grid-template-columns:1fr; gap:10px; }
.lbl{ font-size:12px; color:var(--muted); font-weight:600; }
.req{ color: var(--bad); }

/* inputs with prefix icon */
.field{ position:relative; display:flex; align-items:center; }
.field.ta{ align-items:start; }
.field textarea,
.field input{
  width:100%;
  padding:10px 10px 10px 36px;
  border:1px solid var(--line);
  border-radius:10px;
  font-size:14px; background:#fff; color:var(--text);
}
.field textarea{ resize:vertical; }
.field textarea:focus,
.field input:focus{ outline:2px solid var(--ring); border-color:var(--brand); }
.prefix{ position:absolute; left:8px; top:9px; display:grid; place-items:center;
         width:22px; height:22px; color:#64748b; }

/* hints */
.hints{ display:grid; gap:8px; margin-top:6px; }
.note{ display:flex; gap:8px; align-items:center; font-size:13px;
       border:1px solid var(--line); border-radius:10px; padding:8px 10px; background:#fff; }
.note .material-icons{ color: var(--info); }
.err{ display:flex; gap:6px; align-items:center; color: var(--bad); }

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
.btn:hover{ background:#e76a00; }
.btn.outline{ background:#fff; color:#111827; border:1px solid var(--line); }
.btn.outline:hover{ border-color:var(--brand); }
.material-icons{ font-size:18px; line-height:1; }
  `]
})
export class RejectDialogComponent {
  ref = inject(MatDialogRef<RejectDialogComponent>);

  reason = '';
  meetingId = '';
  annex = '';
  error = '';

  private parseAnnex(): any | undefined {
    if (!this.annex || !this.annex.trim()) return undefined;
    try { return JSON.parse(this.annex); }
    catch { this.error = 'ANNEX must be valid JSON (e.g. {"field":"value"}).'; return undefined; }
  }

  clearErrors(): void { this.error = ''; }
  clearErrorsIfJsonFixed(): void {
    if (!this.annex?.trim()) { this.error = ''; return; }
    try { JSON.parse(this.annex); this.error = ''; } catch { /* keep error */ }
  }

  save(): void {
    this.error = '';
    if (!this.reason.trim()) { this.error = 'Reason is required.'; return; }
    const annexParsed = this.parseAnnex();
    if (this.error) return;

    this.ref.close({
      reason: this.reason.trim(),
      meetingId: (this.meetingId || '').trim() || undefined,
      annex: annexParsed
    });
  }
}
