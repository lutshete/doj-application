import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { OtpComponent } from '../otp/otp.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export default class RegisterComponent {
  signUpForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  alertMessage = '';
  alertType: 'success' | 'danger' = 'danger';
  alertVisible = false;
  private alertTimeout: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.signUpForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        emailAddress: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );

    this.signUpForm.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  private passwordMatchValidator = (form: FormGroup) => {
    const pw = form.get('password')?.value;
    const cpw = form.get('confirmPassword')?.value;
    return pw === cpw ? null : { mismatch: true };
  };

  emailIsJustice(): boolean {
    const email = this.signUpForm.get('emailAddress')?.value || '';
    return typeof email === 'string' && email.toLowerCase().endsWith('@justice.gov.za');
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit() {
    if (this.signUpForm.invalid) {
      this.showAlert('Please fill in all required fields correctly.', 'danger');
      return;
    }

    const payload = {
      firstName: this.f.firstName.value,
      lastName: this.f.lastName.value,
      email: this.f.emailAddress.value,
      password: this.f.password.value
      // NOTE: role is not sent; backend derives it from email domain
    };

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.showAlert(res?.message || 'Registered. Check your email for the OTP.', 'success');
        // open OTP dialog for email verification
        setTimeout(() => {
          this.closeAlert();
          this.dialog.open(OtpComponent, {
            width: '420px',
            disableClose: true,
            data: {
              email: this.f.emailAddress.value,
              onVerified: () => {
                // optional: navigate to login, or auto-login prompt
              }
            }
          });
        }, 800);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Registration failed.';
        this.showAlert(msg, 'danger');
      }
    });
  }

  showAlert(message: string, type: 'success' | 'danger') {
    this.alertMessage = message;
    this.alertType = type;
    this.alertVisible = true;
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.alertVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  closeAlert() {
    this.alertVisible = false;
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.cdr.detectChanges();
  }

  get f() { return this.signUpForm.controls; }
}
