import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { LiquidatorApplicationService } from 'src/app/services/liquidator-application.service';
import { TrackingService } from 'src/app/services/tracking.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, debounceTime } from 'rxjs';



@Component({
  selector: 'app-review-application',
  templateUrl: './review-application.component.html',
  styleUrl: './review-application.component.scss'
})
export class ReviewApplicationComponent {
  fileName: string;
  membershipFileUrl: SafeResourceUrl;
  isNoneOrNo: boolean;
  private subscriptions: Subscription[] = [];
  
viewQualificationPdf(arg0: any) {
throw new Error('Method not implemented.');
}

fileModalUrl: string | null = null; // Stores the file URL for the modal
showFileModal: boolean = false;    // Controls modal visibility
  applicationDetails: any;
  userRole: any;
  applicationId: any;
  reviewForm: FormGroup;
  showComment: { [key: string]: boolean } = {};

  fileType: string | null = null; // Holds the type of the file
  qualificationFileUrl: SafeResourceUrl | null = null;


  zoomLevel: number = 1;
  isPanning: boolean = false;
  startX: number = 0;
  startY: number = 0;
  offsetX: number = 0;
  offsetY: number = 0;


  constructor(
    private trackingService: TrackingService,
    private toastr: ToastrService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private liquidatorApplicationService: LiquidatorApplicationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    this.reviewForm = this.fb.group({
      taxClearancePrivate: ['', Validators.required],
      taxClearanceBusiness: ['', Validators.required],
      bondFacility: ['', Validators.required],
      bankingDetails: ['', Validators.required],
      leaseAgreement: ['', Validators.required],
      idDocument: ['',],
      reviewStatus: ['Draft', Validators.required],
      comments: [''], // General comments field
      taxClearancePrivateComment: [''],
      taxClearanceBusinessComment: [''],
      bondFacilityComment: [''],
      bankingDetailsComment: [''],
      leaseAgreementComment: [''],
      idDocumentComment: ['']
    });

  }

  ngOnInit() {
   
    this.setupConditionalComments(); 
    this.applicationId = +this.route.snapshot.paramMap.get('applicationId')!;
    this.userRole = this.authService.decodeToken();
    this.getAllApplicationsDeails();
  }

  dateOrNoneValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD format
      const isValidDateFormat = dateRegex.test(value) && !isNaN(Date.parse(value));
      const isNone = value === 'none';
      return isValidDateFormat || isNone ? null : { dateOrNone: { value: control.value } };
    };
  }
  getAllApplicationsDeails() {
    this.trackingService.getApplicationDetails(this.applicationId).subscribe({
      next: (response) => {
        console.log(response);
        if (response) {
          this.applicationDetails = response;
        }
      },
      error: (error) => {
        this.toastr.error(error.error?.message, 'Error');
      },
      complete: () => {}
    });
  }

  UpdateApplicationstatus() {
 
  
    if (this.reviewForm.valid) {
      this.liquidatorApplicationService
        .updateApplicationStatus(this.applicationId, {
          review_status: this.reviewForm.get('reviewStatus')?.value,
          outcome: this.reviewForm.get('reviewStatus')?.value,
          tax_clearance_private: this.reviewForm.get('taxClearancePrivate')?.value,
          tax_clearance_private_comment: this.reviewForm.get('taxClearancePrivateComment')?.value,
          tax_clearance_business: this.reviewForm.get('taxClearanceBusiness')?.value,
          tax_clearance_business_comment: this.reviewForm.get('taxClearanceBusinessComment')?.value,
          bond_facility: this.reviewForm.get('bondFacility')?.value,
          bond_facility_comment: this.reviewForm.get('bondFacilityComment')?.value,
          banking_details: this.reviewForm.get('bankingDetails')?.value,
          banking_details_comment: this.reviewForm.get('bankingDetailsComment')?.value,
          lease_agreement: this.reviewForm.get('leaseAgreement')?.value,
          lease_agreement_comment: this.reviewForm.get('leaseAgreementComment')?.value,
          id_document: this.reviewForm.get('idDocument')?.value,
          id_document_comment: this.reviewForm.get('idDocumentComment')?.value,
          comments: this.reviewForm.get('comments')?.value, // General comments
          applicant_name: this.applicationDetails.personalInformation.fullName,
          applicant_email: this.applicationDetails.contactInformation.email,
        })
        .subscribe({
          next: (response) => {
            console.log(response);
            if (response) {
              this.toastr.success(response.message, 'Success');
            }
          },
          error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
          }
        });
    } else {
      Object.keys(this.reviewForm.controls).forEach((controlName) => {
        const control = this.reviewForm.get(controlName);
        control?.markAsTouched();
      });
    }
  }
  
  

  initializeForm() {
    this.reviewForm = this.fb.group({
      taxClearancePrivate: ['', Validators.required],
      taxClearanceBusiness: ['', Validators.required],
      bondFacility: ['', Validators.required],
      bankingDetails: ['', Validators.required],
      leaseAgreement: ['', Validators.required],
      idDocument: ['', Validators.required],
      reviewStatus: ['Draft', Validators.required],
      comments: [''], // General comments field
    });
  }

  setupConditionalComments(): void {
    // Unsubscribe from all existing subscriptions
    this.unsubscribeAll();
  
    const fieldsWithConditionalComments = [
      { controlName: 'taxClearancePrivate', commentControl: 'taxClearancePrivateComment' },
      { controlName: 'taxClearanceBusiness', commentControl: 'taxClearanceBusinessComment' },
      { controlName: 'bondFacility', commentControl: 'bondFacilityComment' },
      { controlName: 'bankingDetails', commentControl: 'bankingDetailsComment' },
      { controlName: 'leaseAgreement', commentControl: 'leaseAgreementComment' },
      { controlName: 'idDocument', commentControl: 'idDocumentComment' },
    ];
  
    fieldsWithConditionalComments.forEach(({ controlName, commentControl }) => {
      const mainControl = this.reviewForm.get(controlName);
      const commentField = this.reviewForm.get(commentControl);
  
      if (!mainControl || !commentField) return;
  
      // Subscribe to valueChanges with debounce and proper handling
      const subscription = mainControl.valueChanges
        .pipe(debounceTime(200)) // Adjust debounce time if needed
        .subscribe((value) => {
          const isConditionalValue = this.isConditionalValue(value);
  
          if (isConditionalValue) {
            commentField.setValidators([Validators.required]);
          } else {
            commentField.clearValidators();
            commentField.patchValue(''); // Ensure no overwriting happens
          }
  
          commentField.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        });
  
      this.subscriptions.push(subscription); // Add subscription for later cleanup
    });
  }
  
  isConditionalValue(value: string | null): boolean {
    if (!value) return false;
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === 'none' ;
  }
  
  unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }
  
  
  
  
  

  generateFileLink(name: string, file: any, file_name: any): void {
    this.fileName = name
    const determineFileType = (fileName: string): string => {
      if (!fileName) return 'application/pdf'; // Default file type
      const lowerCaseFileName = fileName.toLowerCase();
      if (lowerCaseFileName.endsWith('.jpg') || lowerCaseFileName.endsWith('.jpeg')) {
        return 'image/jpeg';
      } else if (lowerCaseFileName.endsWith('.png')) {
        return 'image/png';
      } else if (lowerCaseFileName.endsWith('.gif')) {
        return 'image/gif';
      } else if (lowerCaseFileName.endsWith('.pdf')) {
        return 'application/pdf';
      }
      return 'application/octet-stream';
    };

    if (name === 'Qualifications') {
      const qualificationFileType = determineFileType(file_name.qualification_file_name);
      const qualificationBlob = new Blob([new Uint8Array(file.data)], { type: qualificationFileType });
      const unsafeUrl = URL.createObjectURL(qualificationBlob);

      this.qualificationFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);
      this.fileType = qualificationFileType;
      this.showFileModal = true;
    }

    
    if (name === 'Membership') {
      const membershipFileType = determineFileType(file_name.membership_file_name);
      const membershipBlob = new Blob([new Uint8Array(file.data)], { type: membershipFileType });
      const unsafeUrl = URL.createObjectURL(membershipBlob);

      this.membershipFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);
      this.fileType = membershipFileType;
      this.showFileModal = true;
    }
  }

  closeFileModal(): void {
    this.showFileModal = false;
    this.qualificationFileUrl = null;
    this.fileType = null;
    this.zoomLevel = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  startPanning(event: MouseEvent): void {
    this.isPanning = true;
    this.startX = event.clientX - this.offsetX;
    this.startY = event.clientY - this.offsetY;
  }

  stopPanning(): void {
    this.isPanning = false;
  }

  pan(event: MouseEvent): void {
    if (!this.isPanning) return;
    this.offsetX = event.clientX - this.startX;
    this.offsetY = event.clientY - this.startY;

    const container = document.querySelector('.zoom-container') as HTMLElement;
    if (container) {
      container.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoomLevel})`;
    }
  }

  zoomIn(): void {
    this.zoomLevel += 0.1;
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.2) this.zoomLevel -= 0.1;
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  
  
  
}
