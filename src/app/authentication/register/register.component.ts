import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { OtpComponent } from '../otp/otp.component';
import { SharedModule } from 'src/shared/shared.module';
import { AlertComponent } from 'src/shared/components/alert/alert.component';

@Component({
  selector: 'app-register', 
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export default class RegisterComponent {
  signUpForm: FormGroup | any;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  alertMessage: string = '';
  alertType: 'success' | 'danger' = 'danger';
  alertVisible: boolean = false;
  alertTimeout: any;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.onFormChanges();
  }

  // Initialize the form with default controls and validators
  initializeForm(): void {
    this.signUpForm = this.formBuilder.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        emailAddress: ['', [Validators.required, Validators.email]],
        role: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validator: this.passwordMatchValidator }
    );

    // Enable/disable role based on email validity
    this.signUpForm.get('emailAddress')?.valueChanges.subscribe((email:any) => {
      const roleControl = this.signUpForm.get('role');
      if (this.signUpForm.get('emailAddress')?.valid) {
        roleControl?.enable();
        if (email.endsWith('@justice.gov.za')) {
          roleControl?.setValue('official');
          roleControl?.disable();
        } else {
          roleControl?.setValue('liquidator');
          roleControl?.disable();
        }
      } else {
        roleControl?.disable();
        roleControl?.setValue('');
      }
    });
  }

  // Detect changes and trigger manual change detection for error updates
  private onFormChanges(): void {
    this.signUpForm.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      this.authService.register({
        firstName: this.signUpForm.get('firstName')?.value,
        lastName: this.signUpForm.get('lastName')?.value,
        email: this.signUpForm.get('emailAddress')?.value,
        password: this.signUpForm.get('password')?.value,
        role: this.signUpForm.get('role')?.value
      }).subscribe({
        next: (response) => {
          this.showAlert(response.message, 'success');
          setTimeout(() => {
            this.closeAlert();
            this.dialog.open(OtpComponent, {
              data: {
                email: this.signUpForm.get('emailAddress')?.value,
              }
            });
          }, 3000);
        },
        error: (error) => {
          this.showAlert(error.error.message, 'danger');
        }
      });
    } else {
      this.showAlert('Please fill in all required fields correctly.', 'danger');
    }
  }

  showAlert(message: string, type: 'success' | 'danger') {
    this.alertMessage = message;
    this.alertType = type;
    this.alertVisible = true;

    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    this.alertTimeout = setTimeout(() => {
      this.alertVisible = false;
      this.cdr.detectChanges(); // Ensure the view updates when the alert disappears
    }, 3000);
  }

  closeAlert() {
    this.alertVisible = false;
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    this.cdr.detectChanges();
  }

  get f() {
    return this.signUpForm.controls;
  }
}
