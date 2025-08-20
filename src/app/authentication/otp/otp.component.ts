import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from 'src/shared/shared.module';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [RouterModule, SharedModule],
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'] // <-- plural
})
export class OtpComponent {
  otpForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isResending = false;
  resendCountdown = 0; // seconds
  private resendTimer?: any;

  userEmail: string;
  verificationStatus?: 'pending' | 'none' | 'approved' | string;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<OtpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
  ) {
    this.otpForm = this.fb.group({
      otp1: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp2: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp3: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp4: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp5: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp6: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
    });

    this.userEmail = String(data?.email || '');
    this.verificationStatus = data?.status as any;
  }

  ngOnInit() {
    // If the parent passed 'pending' (e.g., for officials awaiting approval),
    // we can optionally auto-resend on open.
    if (this.verificationStatus === 'pending') {
      this.resendOTP();
    }
  }

  // Submit OTP
  onSubmit() {
    const otpCode = this.getOtpCode();

    if (this.otpForm.invalid || otpCode.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
      this.successMessage = '';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    // Backend: POST /api/auth/verify-email { email, code }
    this.authService.verifyEmail({ email: this.userEmail, code: otpCode }).subscribe({
      next: (res) => {
        // res: { message, approvalStatus, isActive }
        const status = res?.approvalStatus || 'UNKNOWN';
        const isActive = !!res?.isActive;

        if (status === 'APPROVED' && isActive) {
          this.successMessage = 'Email verified. Your account is active.';
        } else if (status === 'PENDING') {
          this.successMessage = 'Email verified. Your account is pending approval.';
        } else if (status === 'NOT_REQUIRED' && isActive) {
          this.successMessage = 'Email verified. You can now log in.';
        } else {
          this.successMessage = res?.message || 'Email verified.';
        }

        // Close and go to login after a short pause
        setTimeout(() => {
          this.dialogRef.close(true);
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.successMessage = '';
        this.errorMessage = err?.error?.message || 'Verification failed. Please check the code and try again.';
      }
    });
  }

  // Concatenate 6 fields into one code
  getOtpCode(): string {
    const v = this.otpForm.value;
    return `${v.otp1}${v.otp2}${v.otp3}${v.otp4}${v.otp5}${v.otp6}`.trim();
  }

  // Resend OTP with cooldown
  resendOTP() {
    if (!this.userEmail || this.isResending || this.resendCountdown > 0) return;

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Backend: POST /api/auth/resend-otp { email }
    this.authService.resendEmailOtp(this.userEmail).subscribe({
      next: () => {
        this.isResending = false;
        this.successMessage = 'A new code has been sent.';
        this.startResendCooldown(30); // 30s cooldown
      },
      error: () => {
        this.isResending = false;
        this.errorMessage = 'Failed to resend OTP. Please try again later.';
      }
    });
  }

  private startResendCooldown(seconds: number) {
    this.resendCountdown = seconds;
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCountdown -= 1;
      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = undefined;
      }
    }, 1000);
  }

  // Auto-advance focus
  moveFocus(event: any, nextElementId: string) {
    const input = event.target as HTMLInputElement;
    if (input.value.length === 1 && nextElementId) {
      const nextInput = document.getElementById(nextElementId);
      nextInput?.focus();
    }
    this.checkCompletion();
  }

  // Backspace focus
  handleBackspace(event: KeyboardEvent, currentElementId: string) {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value) {
      const prevIndex = parseInt(currentElementId.replace('otp', ''), 10) - 1;
      if (prevIndex > 0) document.getElementById(`otp${prevIndex}`)?.focus();
    }
  }

  // Auto-submit if all filled
  checkCompletion() {
    if (Object.values(this.otpForm.value).every(v => v !== '')) {
      this.submitOnComplete();
    }
  }

  submitOnComplete() {
    if (this.otpForm.valid) {
      this.onSubmit();
    }
  }
}
