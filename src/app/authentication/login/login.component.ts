import { ChangeDetectorRef, Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { AuthService, ROLES } from 'src/app/services/auth.service';
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
    private dialog: MatDialog,
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
        // Save session + user
        this.authService.setSessionToken(response.token);
        if (response.user) this.authService.setUserFromMe(response.user);

        this.isSuccess = true;
        this.alertMessage = 'Login successful! Redirecting...';

        // Decide default landing by role
        const role = this.authService.user?.role as ROLES | string;
        const defaultRoute =
          role === ROLES.OFFICIAL || role === ROLES.CHIEF_MASTER
            ? '/admin'
            : '/liquidators';

        // Optional: support returnUrl (?returnUrl=/somewhere) if safe & allowed for this role
        const urlTree = this.router.parseUrl(this.router.url);
        const rawReturnUrl = urlTree.queryParams['returnUrl'] as
          | string
          | undefined;

        const isInternal = (u?: string) =>
          !!u &&
          u.startsWith('/') &&
          !/^(https?:)?\/\//i.test(u) &&
          !/\/login\b/i.test(u);

        const isAllowedForRole = (u: string) => {
          // Block Liquidators from /admin
          if (
            u.startsWith('/admin') &&
            !(role === ROLES.OFFICIAL || role === ROLES.CHIEF_MASTER)
          )
            return false;
          // (Optional) Block Officials/Chief from /liquidators:
          // if (u.startsWith('/liquidators') && (role === ROLES.OFFICIAL || role === ROLES.CHIEF_MASTER)) return false;
          return true;
        };

        const safeReturnUrl =
          isInternal(rawReturnUrl) && isAllowedForRole(rawReturnUrl!)
            ? rawReturnUrl!
            : null;

        const finalTarget = safeReturnUrl || defaultRoute;

        // Navigate (no duplicate timeouts)
        this.router.navigateByUrl(finalTarget, { replaceUrl: true });
      },

      error: (error) => {
        console.log('Login failed', error);

        const status = error.status;
        const message: string = error?.error?.message || 'Login failed';

        // 423: account locked
        if (status === 423) {
          this.isLocked = true;
          this.alertMessage = message;
          this.cdr.detectChanges();
          return;
        }

        // 429: too many attempts
        if (status === 429) {
          this.isSuccess = false;
          this.alertMessage =
            message || 'Too many attempts. Please try again later.';
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

        // 403: verification/approval/deactivated
        if (status === 403) {
          if (/Email not verified/i.test(message)) {
            setTimeout(() => {
              this.dialog.open(OtpComponent, {
                panelClass: 'dlg--flush', // ⬅️ ensures it uses the same style as other modals
                data: {
                  email,
                  status: 'pending',
                  title: 'Enter One-Time Pin',
                  subtitle:
                    'We sent a 6-digit code to your email. Enter it below to continue.',
                },
                width: 'auto', // optional, lets CSS control sizing
                maxWidth: '520px', // matches your other dialogs
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
      },
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
