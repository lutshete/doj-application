import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'] // <-- fix: styleUrls (plural)
})
export class ForgotPasswordComponent {
  forgotPasswordForm!: FormGroup;
  alertMessage: string | null = null;
  isSuccess = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.forgotPasswordForm.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  get email() { return this.forgotPasswordForm.get('email'); }

  isFieldInvalid(field: string): boolean {
    const c = this.forgotPasswordForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  getErrorMessages(field: string): string[] {
    const c = this.forgotPasswordForm.get(field);
    if (!c?.errors) return [];
    const map: Record<string, string> = {
      required: 'This field is required.',
      email: 'Enter a valid email address.',
      minlength: `Must be at least ${c.errors?.['minlength']?.requiredLength} characters.`,
      maxlength: `Must be less than ${c.errors?.['maxlength']?.requiredLength} characters.`
    };
    return Object.keys(c.errors).map(k => map[k] || 'Invalid input.');
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid || this.loading) return;

    this.loading = true;
    const email = this.forgotPasswordForm.value.email;

    // New backend: POST /api/auth/password/reset/request { email }
    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.loading = false;
        this.isSuccess = true;
        // Backend always returns 200 for privacy, so show neutral success text
        this.alertMessage = 'If that account exists, a 6‑digit code has been sent.';
        // Optionally route to the reset page with email prefilled
        setTimeout(() => this.router.navigate(['/reset-password'], { queryParams: { email } }), 800);
      },
      error: (err) => {
        this.loading = false;
        this.isSuccess = false;
        // Keep response generic to avoid enumeration
        this.alertMessage = err?.error?.message || 'If that account exists, a 6‑digit code has been sent.';
      }
    });
  }

  resetAlert() { this.alertMessage = null; }
}
