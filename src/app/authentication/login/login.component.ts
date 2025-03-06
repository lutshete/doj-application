import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AlertComponent } from 'src/shared/components/alert/alert.component';
import { SharedModule } from 'src/shared/shared.module';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  alertMessage: string | null = null;
  isSuccess: boolean = true;
  alertTimeout: any; // Store timeout ID for clearing

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
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
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe(
      (response) => {
        console.log('Login successful', response);
        localStorage.setItem('sessionToken', response.token);
        this.isSuccess = true;
        this.alertMessage = 'Login successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/home']), 1000);
      },
      (error) => {
        console.log('Login failed', error);
        this.isSuccess = false;
        this.alertMessage = error.error.message;
        this.cdr.detectChanges();
        this.startAlertTimeout();
      }
    );
  }

  // Clear alert message after 3 seconds
  private startAlertTimeout() {
    if (this.alertTimeout) clearTimeout(this.alertTimeout); // Clear existing timeout if any
    this.alertTimeout = setTimeout(() => {
      this.alertMessage = null;
      this.cdr.detectChanges(); // Update the view to remove alert
    }, 5000);
  }

  // Method to reset alert manually
  resetAlert() {
    this.alertMessage = null;
    if (this.alertTimeout) clearTimeout(this.alertTimeout); // Clear timeout if manually reset
    this.cdr.detectChanges();
  }

  goToForgotPassword(){
    this.router.navigate(['/forgot-password'])
  }
}
