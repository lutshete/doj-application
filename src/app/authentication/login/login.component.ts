import { ChangeDetectorRef, Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AlertComponent } from 'src/shared/components/alert/alert.component';
import { SharedModule } from 'src/shared/shared.module';
import { OtpComponent } from '../otp/otp.component';
import * as moment from 'moment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  alertMessage: string | null = null;
  isSuccess: boolean = true;
  alertTimeout: any; // Store timeout ID for clearing
  isLocked: boolean = false;
  unlockTime: string | null = null;
  countdown: any; // Store countdown interval

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    this.onFormChanges();
  }

  // Method to detect changes and trigger change detection on each form control
  private onFormChanges(): void {
    this.loginForm.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  // Getter methods for cleaner access in the template
  get email(): AbstractControl | null {
    return this.loginForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  onSubmit() {
  if (this.loginForm.invalid || this.isLocked) return;

  const { email, password } = this.loginForm.value;

  this.authService.login({ email, password }).subscribe({
    next: (response) => {
      // Backend shape: { token, user }
      this.authService.setSessionToken(response.token);
      if (response.user) this.authService.setUserFromMe(response.user);

      this.isSuccess = true;
      this.alertMessage = 'Login successful! Redirecting...';

      // Optional: support returnUrl (?returnUrl=/somewhere)
      const urlTree = this.router.parseUrl(this.router.url);
      const returnUrl = urlTree.queryParams['returnUrl'];

      setTimeout(() => {
        this.router.navigateByUrl(returnUrl || '/default/dashboard');
      }, 800);
    },

    error: (error) => {
      console.log('Login failed', error);

      const status = error.status;
      const message: string = error?.error?.message || 'Login failed';

      // 423: account locked (server returns human-readable minutes remaining)
      if (status === 423) {
        this.isLocked = true;
        this.alertMessage = message; // e.g., "Account locked. Try again in 14 minute(s)."
        this.cdr.detectChanges();
        // If you have a countdown implementation, you can start it here.
        return;
      }

      // 429: too many attempts / rate limit
      if (status === 429) {
        this.isSuccess = false;
        this.alertMessage = message || 'Too many attempts. Please try again later.';
        this.cdr.detectChanges();
        this.startAlertTimeout?.();
        return;
      }

      // 401: invalid credentials
      if (status === 401) {
        this.isSuccess = false;
        this.alertMessage = message || 'Invalid credentials';
        this.cdr.detectChanges();
        this.startAlertTimeout?.();
        return;
      }

      // 403 cases:
      // - "Email not verified"
      // - "Official account not approved (status: PENDING)"
      // - "Account is deactivated"
      if (status === 403) {
        if (/Email not verified/i.test(message)) {
          // Open OTP dialog so user can verify
          setTimeout(() => {
            this.dialog.open(OtpComponent, {
              data: { email, status: 'pending' }
            });
          }, 300);
        }

        this.isSuccess = false;
        this.alertMessage = message;
        this.cdr.detectChanges();
        this.startAlertTimeout?.();
        return;
      }

      // Fallback
      this.isSuccess = false;
      this.alertMessage = message;
      this.cdr.detectChanges();
      this.startAlertTimeout?.();
    }
  });
}


  // ✅ Start countdown for account unlock
  private startCountdown() {
    if (!this.unlockTime) return;

    const unlockMoment = moment(this.unlockTime);
    this.countdown = setInterval(() => {
      const remainingMinutes = unlockMoment.diff(moment(), 'minutes');

      if (remainingMinutes <= 0) {
        clearInterval(this.countdown);
        this.isLocked = false;
        this.unlockTime = null;
        this.alertMessage = null;
        this.cdr.detectChanges();
      } else {
        this.alertMessage = `Your account is locked. Try again in ${remainingMinutes} minutes.`;
        this.cdr.detectChanges();
      }
    }, 60000); // Update every minute
  }

  // ✅ Calculate remaining time until unlock
  private calculateRemainingTime(): number {
    if (!this.unlockTime) return 0;
    return moment(this.unlockTime).diff(moment(), 'minutes');
  }

  // ✅ Clear alert message after 5 seconds
  private startAlertTimeout() {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.alertMessage = null;
      this.cdr.detectChanges();
    }, 5000);
  }

  // ✅ Reset alert manually
  resetAlert() {
    this.alertMessage = null;
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.cdr.detectChanges();
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
