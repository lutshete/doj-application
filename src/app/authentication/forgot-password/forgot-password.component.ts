import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router,RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { SharedModule } from 'src/shared/shared.module';
import { AlertComponent } from 'src/shared/components/alert/alert.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup | any;
  alertMessage: string | null = null;
  isSuccess: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
   private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Detect validation changes dynamically
    this.forgotPasswordForm.valueChanges.subscribe(() => {
      this.cdr.detectChanges(); // Force UI update on form state change
    });
  }


  get email() {
    return this.forgotPasswordForm.get('email');
  }



  // Check if a field is invalid
  isFieldInvalid(field: string): boolean {
    const control = this.forgotPasswordForm.get(field);
    return control?.invalid && (control?.dirty || control?.touched);
  }

  // Get dynamic error messages
  getErrorMessages(field: string): string[] {
    const control = this.forgotPasswordForm.get(field);
    if (!control || !control.errors) return [];

    const errorMessages: { [key: string]: string } = {
      required: 'This field is required.',
      email: 'Enter a valid email address.',
      minlength: `Must be at least ${control.errors?.['minlength']?.requiredLength} characters.`,
      maxlength: `Must be less than ${control.errors?.['maxlength']?.requiredLength} characters.`
    };

    return Object.keys(control.errors).map(error => errorMessages[error] || 'Invalid input.');
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.forgotPassword(this.forgotPasswordForm.value.email).subscribe(
      response => {
        this.loading = false;
        this.isSuccess = true;
        this.alertMessage = 'Password reset link sent to your email.';
      },
      error => {
        this.loading = false;
        this.isSuccess = false;
        this.alertMessage = error.error.message || 'Error sending reset link.';
      }
    );
  }

  resetAlert() {
    this.alertMessage = null;
  }
}
