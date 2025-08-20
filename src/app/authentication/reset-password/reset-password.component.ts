import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'] // <-- plural
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  alertMessage: string | null = null;
  isSuccess = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email') || '';

    this.resetPasswordForm = this.fb.group(
      {
        email: [emailFromQuery, [Validators.required, Validators.email]],
        code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );

    // react to form changes for UI updates
    this.resetPasswordForm.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  private passwordMatchValidator = (form: FormGroup) => {
    const a = form.get('newPassword')?.value;
    const b = form.get('confirmPassword')?.value;
    return a === b ? null : { mismatch: true };
  };

  isFieldInvalid(field: string): boolean {
    const control = this.resetPasswordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessages(field: string): string[] {
    const control = this.resetPasswordForm.get(field);
    if (!control || !control.errors) return [];
    const msg: Record<string, string> = {
      required: 'This field is required.',
      email: 'Enter a valid email address.',
      minlength: `Must be at least ${control.errors?.['minlength']?.requiredLength} characters.`,
      maxlength: `Must be less than ${control.errors?.['maxlength']?.requiredLength} characters.`,
      pattern: 'Enter the 6‑digit code.'
    };
    return Object.keys(control.errors).map(k => msg[k] || 'Invalid input.');
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || this.loading) {
      this.alertMessage = 'Please fill in all fields correctly.';
      this.isSuccess = false;
      return;
    }

    this.loading = true;
    this.alertMessage = null;

    const payload = {
      email: this.resetPasswordForm.value.email,
      code: this.resetPasswordForm.value.code,
      newPassword: this.resetPasswordForm.value.newPassword
    };

    // New backend: POST /api/auth/password/reset/confirm
    this.authService.resetPasswordWithOtp(payload).subscribe({
      next: () => {
        this.loading = false;
        this.isSuccess = true;
        this.alertMessage = 'Password successfully reset. Redirecting…';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.isSuccess = false;
        this.alertMessage = err?.error?.message || 'Failed to reset password. Check your code and try again.';
        // console.error('Password Reset Error:', err);
      }
    });
  }
}
