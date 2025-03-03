import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router,RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AlertComponent } from 'src/shared/components/alert/alert.component';
import { SharedModule } from 'src/shared/shared.module';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit{
  resetPasswordForm: FormGroup | any;
  alertMessage: string | null = null;
  isSuccess: boolean = false;
  loading: boolean = false;
  token: string | null = null;
  isValidToken: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

      // Listen for form changes and update UI dynamically
      this.resetPasswordForm.valueChanges.subscribe(() => {
        this.cdr.detectChanges();
      });
  }

  ngOnInit() {
    // Extract token from URL
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (this.token) {
      // Call the backend to check if the token is valid
      this.authService.verifyResetToken(this.token).subscribe(
        () => {
          this.isValidToken = true;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error => {
          this.isValidToken = false;
          this.loading = false;
          this.errorMessage = error.error.error || 'Invalid or expired reset token.';
          setTimeout(() => this.router.navigate(['/forgot-password']), 3000); // Redirect after 3s
          this.cdr.detectChanges();
        }
      );
    } else {
      this.loading = false;
      this.errorMessage = 'Invalid reset link.';
      setTimeout(() => this.router.navigate(['/forgot-password']), 3000);
      this.cdr.detectChanges();
    }
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  isFieldInvalid(field: string): boolean {
    const control = this.resetPasswordForm.get(field);
    return control?.invalid && (control?.dirty || control?.touched);
  }

  getErrorMessages(field: string): string[] {
    const control = this.resetPasswordForm.get(field);
    if (!control || !control.errors) return [];

    const errorMessages: { [key: string]: string } = {
      required: 'This field is required.',
      minlength: `Must be at least ${control.errors?.['minlength']?.requiredLength} characters.`,
      maxlength: `Must be less than ${control.errors?.['maxlength']?.requiredLength} characters.`
    };

    return Object.keys(control.errors).map(error => errorMessages[error] || 'Invalid input.');
  }

  onSubmit() {
    // Check if the form is invalid or the token is missing
    console.log(this.resetPasswordForm)
    if (this.resetPasswordForm.invalid || !this.token) {
        alert('Please fill in all fields correctly.');
        return;
    }

    // Check if passwords match
    if (this.resetPasswordForm.value.newPassword !== this.resetPasswordForm.value.confirmPassword) {
        this.alertMessage = 'Passwords do not match.';
        return;
    }

    // Show loading indicator
    this.loading = true;
    this.alertMessage = null; // Clear any previous messages

    this.authService.resetPassword(this.token, this.resetPasswordForm.value.newPassword).subscribe(
        response => {
            this.loading = false;
            this.isSuccess = true;
            this.alertMessage = 'Password successfully reset. Redirecting...';

            // Redirect to login after success
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 3000);
        },
        error => {
            this.loading = false;
            this.isSuccess = false;
            this.alertMessage = error.error.message || 'Failed to reset password.';

            // Optional: Log error to console for debugging
            console.error('Password Reset Error:', error);
        }
    );
}

}