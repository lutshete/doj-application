import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

type OtpDialogData = {
  email: string; // who we verify
  status?: 'pending' | 'none' | 'approved' | string;
  title?: string; // optional custom title
  subtitle?: string; // optional helper text
  cooldownSeconds?: number; // default 30
  testCode?: string;
};

@Component({
  standalone: true,
  selector: 'app-otp-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section
      class="dlg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otpTitle"
    >
      <!-- Header -->
      <header class="dlg__hdr info">
        <div class="ic" aria-hidden="true">
          <span class="material-icons">verified_user</span>
        </div>
        <div>
          <h3 class="title" id="otpTitle">
            {{ data?.title || 'Enter One‑Time Pin' }}
          </h3>
          <div class="sub muted">
            {{
              data?.subtitle ||
                'We sent a 6‑digit code to ' +
                  userEmail +
                  '. Enter it below to continue.'
            }}
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="dlg__content">
        <!-- Success / Error messages -->
        <div
          *ngIf="data?.testCode || testCode"
          class="test-chip"
          role="status"
          aria-live="polite"
        >
          <span class="material-icons">beaker</span>
          Testing OTP: <strong>{{ data.testCode || testCode }}</strong>
          <button type="button" class="chip-btn" (click)="fillFromTestCode()">
            Fill code
          </button>
          <button type="button" class="chip-btn" (click)="copyTestCode()">
            Copy
          </button>
        </div>
        <p *ngIf="successMessage" class="msg ok" role="status">
          <span class="material-icons">check_circle</span>
          <span>{{ successMessage }}</span>
        </p>
        <p *ngIf="errorMessage" class="msg bad" role="alert">
          <span class="material-icons">error</span>
          <span>{{ errorMessage }}</span>
        </p>

        <form
          [formGroup]="otpForm"
          (ngSubmit)="onSubmit()"
          class="grid"
          novalidate
        >
          <label class="lbl">Verification code</label>

          <div
            class="otp-row"
            role="group"
            aria-label="Six digit verification code"
          >
            <input
              *ngFor="let c of cells; let i = index"
              [id]="'otp' + (i + 1)"
              class="otp-cell"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              [attr.aria-label]="'Digit ' + (i + 1)"
              [formControlName]="c"
              (input)="moveFocus($event, i + 1)"
              (keydown)="handleKey($event, i)"
              [autofocus]="i === 0"
            />
          </div>

          <!-- Resend -->
          <div class="sub muted resend">
            <ng-container *ngIf="resendCountdown === 0; else cooldownTpl">
              <button
                type="button"
                class="link"
                (click)="resendOTP()"
                [disabled]="isResending"
              >
                <span class="material-icons" *ngIf="!isResending">refresh</span>
                <span
                  class="material-icons"
                  *ngIf="isResending"
                  aria-hidden="true"
                  >hourglass_top</span
                >
                {{
                  isResending ? 'Resending…' : 'Didn’t receive a code? Resend'
                }}
              </button>
            </ng-container>
            <ng-template #cooldownTpl>
              You can resend in {{ resendCountdown }}s
            </ng-template>
          </div>
        </form>
      </div>

      <!-- Actions -->
      <footer class="dlg__actions">
        <button class="btn outline" type="button" (click)="ref.close()">
          <span class="material-icons">close</span> Cancel
        </button>
        <button
          class="btn"
          type="button"
          (click)="onSubmit()"
          [disabled]="otpForm.invalid || verifying"
          [attr.aria-busy]="verifying"
        >
          <span class="material-icons">check_circle</span>
          {{ verifying ? 'Verifying…' : 'Verify' }}
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
        --bad: #dc3545;
        --info: #007bff;
        display: block;
      }
      /* Match other dialogs: remove default Mat padding when parent adds .dlg--flush */
      :host ::ng-deep .dlg--flush .mat-mdc-dialog-surface {
        padding: 0 !important;
        overflow: hidden !important;
      }

      .dlg {
        width: min(400px, calc(100vw - 40px));
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
      .dlg__hdr.ok .material-icons {
        color: var(--ok);
      }
      .dlg__hdr.info .material-icons {
        color: var(--info);
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
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
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

      .otp-row {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin: 12px 0;
        flex-wrap: nowrap;
        max-width: 100%;
        min-width: 0;
      }
      .otp-cell {
        width: 44px;
        height: 56px;
        text-align: center;
        font-size: 20px;
        font-weight: 700;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        color: var(--text);
        transition: transform 0.06s ease;
        min-width: 0;
      }
      .otp-cell:focus {
        outline: 2px solid var(--ring);
        border-color: var(--brand);
        transform: scale(1.03);
      }
      .otp-cell::-webkit-outer-spin-button,
      .otp-cell::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .otp-cell[type='number'] {
        -moz-appearance: textfield;
      }

      .msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--line);
        margin: 0 0 8px 0;
        font-size: 13px;
      }
      .msg.ok {
        border-color: #d1fadf;
        background: #f0fff4;
        color: #14532d;
      }
      .msg.bad {
        border-color: #ffe4e6;
        background: #fff1f2;
        color: #7f1d1d;
      }

      .resend {
        margin-top: 2px;
      }
      .link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--info);
        font-weight: 700;
      }
      .link:hover {
        text-decoration: underline;
      }

      .dlg__actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid var(--line);
        background: #fff;
        flex: 0 0 auto;
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
        background: var(--brand);
        color: #fff;
      }
      .btn:hover {
        background: var(--brand-600);
      }
      .btn.outline {
        background: #fff;
        color: #111827;
        border: 1px solid var(--line);
      }
      .btn.outline:hover {
        border-color: var(--brand);
      }
      .material-icons {
        font-size: 18px;
        line-height: 1;
      }

      .test-chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        margin: 8px 0 10px;
        border: 1px dashed var(--info);
        background: #f0f7ff;
        color: #0b3d91;
        border-radius: 10px;
        font-size: 12px;
      }
      .test-chip .material-icons {
        font-size: 16px;
      }
      .chip-btn {
        border: none;
        background: #fff;
        color: var(--info);
        border: 1px solid var(--line);
        padding: 4px 8px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
      }
      .chip-btn:hover {
        border-color: var(--info);
      }
    `,
  ],
})
export class OtpComponent implements OnInit {
  ref = inject(MatDialogRef<OtpComponent>);
  data = inject(MAT_DIALOG_DATA) as OtpDialogData;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // UI state
  successMessage = '';
  errorMessage = '';
  verifying = false;

  // resend state
  resendCountdown = 0;
  isResending = false;
  private cooldown = this.data?.cooldownSeconds ?? 30;
  private timerId: any;

  // form
  cells = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'] as const;
  otpForm: FormGroup = this.fb.group({
    otp1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
    otp2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
    otp3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
    otp4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
    otp5: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
    otp6: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
  });

  userEmail = this.data?.email || '';
  verificationStatus = this.data?.status;
  testCode: string;

  ngOnInit(): void {
    // optional auto-resend if host marks status pending
     const autoResend = this.data?.status === 'pending' && !this.data?.testCode;
  if (autoResend) {
    this.resendOTP();
  }
  }

  // ===== UI handlers =====
  moveFocus(ev: Event, nextIndex: number) {
    const input = ev.target as HTMLInputElement;
    const val = (input.value || '').replace(/\D/g, '');
    input.value = val.slice(-1);
    const idx = nextIndex; // already the next
    if (val && idx < 6) {
      const next = document.getElementById(
        'otp' + (idx + 1),
      ) as HTMLInputElement | null;
      next?.focus();
      next?.select?.();
    } else if (val && idx === 6) {
      this.submitOnComplete();
    }
  }

  handleKey(e: KeyboardEvent, index: number) {
    const curr = document.getElementById(
      'otp' + (index + 1),
    ) as HTMLInputElement | null;
    if (e.key === 'Backspace') {
      if (curr && !curr.value && index > 0) {
        const prev = document.getElementById(
          'otp' + index,
        ) as HTMLInputElement | null;
        prev?.focus();
        prev?.select?.();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      (document.getElementById('otp' + index) as HTMLInputElement)?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      (
        document.getElementById('otp' + (index + 2)) as HTMLInputElement
      )?.focus();
    }
    // only allow digits
    if (
      !/[0-9]/.test(e.key) &&
      ![
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Backspace',
        'Delete',
        'Enter',
      ].includes(e.key)
    ) {
      e.preventDefault();
    }
  }

  // ===== Submit & Resend (real backend calls) =====
  onSubmit() {
    if (this.verifying || this.otpForm.invalid) return;
    const code = this.cells.map((k) => this.otpForm.get(k)?.value).join('');
    if (code.length !== 6) return;

    this.verifying = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.verifyEmail({ email: this.userEmail, code }).subscribe({
      next: (res) => {
        this.verifying = false;
        const status = res?.approvalStatus || 'UNKNOWN';
        const isActive = !!res?.isActive;

        if (status === 'APPROVED' && isActive) {
          this.successMessage = 'Email verified. Your account is active.';
        } else if (status === 'PENDING') {
          this.successMessage =
            'Email verified. Your account is pending approval.';
        } else if (status === 'NOT_REQUIRED' && isActive) {
          this.successMessage = 'Email verified. You can now log in.';
        } else {
          this.successMessage = res?.message || 'Email verified.';
        }

        setTimeout(() => {
          this.ref.close(true);
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.verifying = false;
        this.successMessage = '';
        this.errorMessage =
          err?.error?.message ||
          'Verification failed. Please check the code and try again.';
      },
    });
  }

  resendOTP() {
    if (!this.userEmail || this.isResending || this.resendCountdown > 0) return;

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.resendEmailOtp(this.userEmail).subscribe({
      next: (res) => {
        this.isResending = false;
        this.successMessage = 'A new code has been sent.';
           const code = res?.code ?? undefined;
      if (code) {this.testCode = String(code)};
        this.startResendCooldown(this.cooldown);
      },
      error: () => {
        this.isResending = false;
        this.errorMessage = 'Failed to resend OTP. Please try again later.';
      },
    });
  }

  private startResendCooldown(seconds: number) {
    this.resendCountdown = seconds;
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.timerId);
        this.resendCountdown = 0;
      }
    }, 1000);
  }

  submitOnComplete() {
    if (this.otpForm.valid) this.onSubmit();
  }

  fillFromTestCode() {
    const code = (this.data?.testCode || '').replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) return;
    // split into cells
    code.split('').forEach((digit, i) => {
      const key = this.cells[i];
      this.otpForm.get(key)?.setValue(digit);
    });
    // move focus to last box and auto-submit
    document.getElementById('otp6')?.focus();
    this.submitOnComplete();
  }

  async copyTestCode() {
    try {
      await navigator.clipboard.writeText(this.data?.testCode || '');
      this.successMessage = 'Testing code copied to clipboard.';
      setTimeout(() => (this.successMessage = ''), 1500);
    } catch {
      this.errorMessage = 'Could not copy code.';
      setTimeout(() => (this.errorMessage = ''), 1500);
    }
  }
}
