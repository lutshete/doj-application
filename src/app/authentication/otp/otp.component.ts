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
  styleUrls: ['./otp.component.scss']
})
export class OtpComponent {
  otpForm: FormGroup;
  errorMessage: string = '';
  isResending: boolean = false;
  userEmail: any;
  verificationStatus

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<OtpComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
  ) {
    // Initialize the form with validators for all 6 OTP fields
    this.otpForm = this.fb.group({
      otp1: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp2: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp3: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp4: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp5: ['', [Validators.required, Validators.pattern('[0-9]{1}')]],
      otp6: ['', [Validators.required, Validators.pattern('[0-9]{1}')]]
    });
    this.userEmail = data.email;
    this.verificationStatus = data.status

  }

  ngOnInit() {
   if(this.verificationStatus === 'pending'){
    this.resendOTP()
   }
  }

  // Method to handle OTP form submission
  onSubmit() {
    const otpCode = this.getOtpCode();
  
    if (this.otpForm.valid) {
      this.authService.verifyOtp({ email: this.userEmail, otp: otpCode }).subscribe({
        next: (response) => {
          this.errorMessage = response.message;
  
          // Wait for 5000ms before closing the dialog and navigating to login
          setTimeout(() => {
            this.dialogRef.close();  // Close dialog after 5 seconds
            this.router.navigate(['/login']);  // Navigate to login after dialog is closed
          }, 5000);  // 5000 milliseconds (5 seconds)
        },
        error: (err) => {
          console.log(err.error);
          this.errorMessage = err.error.message;
        }
      });
    } else {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
    }
  }
  
  

  // Helper method to concatenate OTP fields into a single string
  getOtpCode(): string {
    return `${this.otpForm.value.otp1}${this.otpForm.value.otp2}${this.otpForm.value.otp3}${this.otpForm.value.otp4}${this.otpForm.value.otp5}${this.otpForm.value.otp6}`;
  }

  // Method to handle OTP resending
  resendOTP() {
    console.log(this.userEmail)
    this.isResending = true;
    this.authService.resendOtp({email:this.userEmail}).subscribe({
      next: () => {
        this.isResending = false;
      },
      error: () => {
        this.isResending = false;
        this.errorMessage = 'Failed to resend OTP. Please try again later.';
      }
    });
  }

  // Function to handle auto-focus movement between OTP inputs
  moveFocus(event: any, nextElementId: string) {
    const input = event.target;
    if (input.value.length === 1 && nextElementId) {
      const nextInput = document.getElementById(nextElementId);
      nextInput?.focus();
    }
    this.checkCompletion();
  }

  handleBackspace(event: KeyboardEvent, currentElementId: string) {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value) {
      const prevIndex = parseInt(currentElementId.replace('otp', ''), 10) - 1;
      if (prevIndex > 0) {
        const prevInput = document.getElementById(`otp${prevIndex}`);
        prevInput?.focus();
      }
    }
  }

  checkCompletion() {
    if (Object.values(this.otpForm.value).every(val => val !== '')) {
      this.submitOnComplete();
    }
  }


  // Automatically submit OTP when all fields are filled
  submitOnComplete() {
    if (this.otpForm.valid) {
      this.onSubmit();
    }
  }


  
}
