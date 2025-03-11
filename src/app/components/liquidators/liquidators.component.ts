// angular import
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// project import

import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { LiquidatorApplicationService } from 'src/app/services/liquidator-application.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, Subscription, interval, switchMap } from 'rxjs';
import { AdminService } from 'src/app/services/admin.service';

declare const google: any;

@Component({
  selector: 'app-liquidators',
  templateUrl: './liquidators.component.html',
  styleUrl: './liquidators.component.scss',
})
export class LiquidatorsComponent implements OnInit, OnChanges {
  personalInfoForm: FormGroup;
  businessForm: FormGroup;
  empBusTradingForm: FormGroup;
  businessDetailsOfficeForm: FormGroup;
  businessAdressDetailsForm: FormGroup;
  qualProMembershipForm: FormGroup;
  disqualRelationshipForm: FormGroup;
  appEmpHistoryForm: FormGroup;
  taxBondBankForm: FormGroup;
  private autocompleteInitialized = false;
  hasTradingPartners = false;

  qualificationsList = [
    { label: 'LLB', value: 'LLB' },
    { label: 'BCom', value: 'BCom_Accounting' },
  ];

  professionalMembershipOptions = [
    { label: 'LPC', value: 'LPC' },
    { label: 'SICA', value: 'SICA' },
    { label: 'SAIPA', value: 'SAIPA' },
  ];

  citiesList = [
    'Johannesburg',
    'Kimberley',
    'Nelspruit',
    'Pretoria',
    'Mahikeng',
    'Thohoyandou',
    'Cape Town',
    'Durban',
    'Bisho',
    'Pietermaritzburg',
    'Mthatha',
    'Polokwane',
    'Gqebera',
    'Bloemfontein',
    'Makhanda',
    'Middelburg',
  ];

  selectedAppointmentLocations: string[] = [];

  group1Section: boolean;
  group2Section: boolean;
  group3Section: boolean;
  group4Section: boolean;
  group5Section: boolean;
  group6Section: boolean;
  group7Section: boolean;
  group8Section: boolean;

  group1SectionText: any;
  group1SectionCircle: any;
  group1SectionEdit: boolean;
  group1SectionValid: boolean;

  group2SectionText: string;
  group2SectionCircle: any;
  group2SectionEdit: boolean;
  group2SectionValid: boolean;

  group3SectionText: string;
  group3SectionCircle: any;
  group3SectionEdit: boolean;
  group3SectionValid: boolean;

  group4SectionText: string;
  group4SectionCircle: any;
  group4SectionEdit: boolean;
  group4SectionValid: boolean;

  group5SectionText: string;
  group5SectionCircle: any;
  group5SectionEdit: boolean;
  group5SectionValid: boolean;

  group6SectionText: string;
  group6SectionCircle: any;
  group6SectionEdit: boolean;
  group6SectionValid: boolean;

  group7SectionText: string;
  group7SectionCircle: any;
  group7SectionEdit: boolean;
  group7SectionValid: boolean;

  group8SectionText: string;
  group8SectionCircle: any;
  group8SectionEdit: boolean;
  group8SectionValid: boolean;

  group9SectionValid: boolean;

  userRole: any;

  section1Details: any;
  applicationId: any;
  section2Details: any;
  sectionDetails: any;
  section3Details: any;
  section4Details: any;
  section5Details: any;
  section6Details: any;
  membershipConfirmationFile: File;
  membershipConfirmationFileName: File;
  section7Details: any;
  section8Details: any;
  section9Details: any;

  @Output() setAddress: EventEmitter<any> = new EventEmitter();
  @ViewChild('addresstext', { static: true }) addresstext!: ElementRef;
  File: any;
  FileName: string;
  pdfUrl: string;
  fileUrl: string;
  partDetails: any;

  qualificationFile_file_name: string;
  qualificationFile_file: any;
  membership_file_name: string;
  membership_file: any;
  qualificationFileUrl: any;
  membershipFileUrl: any;
  idDocumentFileUrl: any;
  showRelationshipDetails: boolean = false;
  csFileName: string | Blob;
  cvFile: string | Blob;
  TaxClearanceFile: File;
  TaxClearanceFileName: string;
  bankAccountFile: File;
  bankAccountFileName: string;
  bondFacilityFile: File;
  bondFacilityFileName: string;
  curriculumVitaeFileUrl: string;
  taxClearanceCertificateFileUrl: string;
  bondFacilityFileUrl: string;
  bankAccountProofFileUrl: any;
  closingDate: Date;
  daysRemaining: number = 0;
  remainingHours: number = 0;
  showHours: boolean = false;
  private countdownSubscription: Subscription | undefined;
  currentStep: number = 1;
  formIsComplete: boolean = false;
  application_status;
  current_form_status;
  loading: boolean = false; // Track loading state
  currentApplicationDate: any = null;
  isTermsRead = false;
  @ViewChild('modalBody') modalBody!: ElementRef;

  openingDate;
  showOpeningHours: boolean = false;
  openingRemainingHours: number = 0;
  openingDaysRemaining: number = 0;

  isBetweenOpeningAndClosing: boolean = false;
  nextOpeningYear: number | null;

  constructor(
    private fb: FormBuilder,
    private liquidatorApplicationService: LiquidatorApplicationService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
  ) {}

  ngOnInit() {
    this.initialiseSection1();
    this.initialiseSection2();
    this.initialiseSection3();
    this.initialiseSection4();
    this.initialiseSection5();
    this.initialiseSection6();
    this.initialiseSection7();
    this.initialiseSection8();
    this.loadCurrentApplicationDate();
    // Initialize section states and activate the first section
    this.initializeSections();
    this.setActiveSection(1); // Activates group one by default

    // Retrieve and decode the user's role
    this.userRole = this.authService.decodeToken();
    this.getAppication();

    const savedSection1Details = localStorage.getItem('section1Details');
    const savedSection2Details = localStorage.getItem('section2Details');
    const savedSection3Details = localStorage.getItem('section3Details');
    const savedPartnerDetails = localStorage.getItem('partnerDetails');

    const savedSection4Details = localStorage.getItem('section4Details');
    const savedSection5Details = localStorage.getItem('section5Details');

    const savedSection6Details = localStorage.getItem('section6Details');

    const savedSection7Details = localStorage.getItem('section7Details');

    const savedSection8Details = localStorage.getItem('section8Details');
    const savedSection9Details = localStorage.getItem('section9Details');

    this.applicationId = localStorage.getItem('applicationId');

    if (savedSection1Details) {
      this.group1SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section1Details = JSON.parse(savedSection1Details);

      this.patchPersonalInfoForm(); // Patch the form with saved data
      this.moveGroupTwoSection();
      this.group2SectionValid = this.businessForm.valid;
      this.fetchStatus();
    }

    if (savedSection2Details) {
      this.group2SectionText = 'active valid-text';

      this.cdr.detectChanges();
      this.section2Details = JSON.parse(savedSection2Details);
      this.patchVerificationBusiness(); // Patch the form with saved data
      this.moveGroupThreeSection();
    }

    if (savedSection3Details) {
      this.group3SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section3Details = JSON.parse(savedSection3Details);
      this.partDetails = JSON.parse(savedPartnerDetails);
      this.patchempBusTrading();
      this.moveGroupFourSection();
    }

    if (savedSection4Details && savedSection5Details) {
      this.group3SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section4Details = JSON.parse(savedSection4Details);
      this.section5Details = JSON.parse(savedSection5Details);
      this.patchbusinessDetailsOffice();
      this.moveGroupFiveSection();
    }

    if (savedSection6Details) {
      this.group5SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section6Details = JSON.parse(savedSection6Details);

      this.patchQualProMembership();
      this.moveGroupSixSection();
    }

    if (savedSection7Details) {
      this.group6SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section7Details = JSON.parse(savedSection7Details);

      this.patchDisqualRelationship();
      this.moveGroupSevenSection();
    }

    if (savedSection8Details) {
      this.group7SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section8Details = JSON.parse(savedSection8Details);

      this.patchAppEmpHistory();
      this.moveGroupEightSection();
    }

    if (savedSection9Details) {
      this.group8SectionText = 'active valid-text';
      this.cdr.detectChanges();
      this.section9Details = JSON.parse(savedSection9Details);

      this.patchTaxBondBank();

      this.updateButtonState();
      this.moveGroupNineSection();
    }
    this.updateCountdown(); // Initialize countdown values
    this.startCountdown(); // Start countdown updates
  }

  initialiseSection1() {
    this.personalInfoForm = this.fb.group({
      fullName: ['', Validators.required],
      identityNumber: [
        '',
        [Validators.required, this.southAfricanIdValidator()],
      ],
      race: ['', Validators.required],
      gender: ['', Validators.required],
      identityDocument: ['', Validators.required],
    });

    this.personalInfoForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.personalInfoForm.invalid &&
        Object.keys(this.personalInfoForm.controls).some(
          (key) =>
            this.personalInfoForm.get(key)?.touched ||
            this.personalInfoForm.get(key)?.dirty,
        )
      ) {
        this.group1SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group1SectionText = 'active edit-text';
        this.group1SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.personalInfoForm.valid) {
        this.group1SectionEdit = false;
        this.group1SectionValid = true; // Show check icon if form is valid
        this.group1SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group1SectionEdit = false;
        this.group1SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log(file);

      this.File = file;
      this.FileName = file.name;
    } else {
    }
  }

  onFileSelectedCV(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.cvFile = file;
      this.csFileName = file.name;
    } else {
    }
  }

  onFileSelectedTaxClearance(event: Event, control: string): void {
    console.log(this.taxBondBankForm);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (control === 'taxClearance') {
        this.TaxClearanceFile = file;
        this.TaxClearanceFileName = file.name;
      }

      if (control === 'bankAccountDocumentation') {
        this.bankAccountFile = file;
        this.bankAccountFileName = file.name;
      }

      if (control === 'bondFacility') {
        this.bondFacilityFile = file;
        this.bondFacilityFileName = file.name;
      }
    } else {
    }
  }

  initialiseSection2() {
    this.businessForm = this.fb.group(
      {
        businessType: ['', [Validators.required]],
        businessStatus: ['', [Validators.required]],
      },
      {
        validators: this.mutuallyExclusiveValidator(
          'businessType',
          'businessStatus',
        ),
      },
    );

    // Listen for changes in businessType and clear businessStatus if businessType is filled
    this.businessForm.get('businessType')?.valueChanges.subscribe((value) => {
      if (value) {
        this.businessForm.get('businessStatus')?.setValue(''); // Clear businessStatus
      }
      this.businessForm.updateValueAndValidity(); // Revalidate the form
    });

    // Listen for changes in businessStatus and clear businessType if businessStatus is filled
    this.businessForm.get('businessStatus')?.valueChanges.subscribe((value) => {
      if (value) {
        this.businessForm.get('businessType')?.setValue(''); // Clear businessType
      }
      this.businessForm.updateValueAndValidity(); // Revalidate the form
    });

    // Force an initial validation to ensure form is invalid by default
    this.businessForm.updateValueAndValidity();

    this.businessForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.businessForm.invalid &&
        Object.keys(this.businessForm.controls).some(
          (key) =>
            this.businessForm.get(key)?.touched ||
            this.businessForm.get(key)?.dirty,
        )
      ) {
        this.group2SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group2SectionText = 'active edit-text';
        this.group2SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.personalInfoForm.valid) {
        this.group2SectionEdit = false;
        this.group2SectionValid = true; // Show check icon if form is valid
        this.group2SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group2SectionEdit = false;
        this.group2SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  mutuallyExclusiveValidator(
    controlName1: string,
    controlName2: string,
  ): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const group = formGroup as FormGroup;
      const control1 = group.controls[controlName1];
      const control2 = group.controls[controlName2];

      if (!control1 || !control2) {
        return null; // One or both controls are missing
      }

      // Clear previous validation errors
      control1.setErrors(null);
      control2.setErrors(null);

      // Case 1: Both fields are empty -> INVALID
      if (!control1.value && !control2.value) {
        control1.setErrors({ required: true });
        control2.setErrors({ required: true });
        return { mutuallyExclusive: true };
      }

      // Case 2: Both fields have values -> INVALID
      if (control1.value && control2.value) {
        control1.setErrors({ mutuallyExclusive: true });
        control2.setErrors({ mutuallyExclusive: true });
        return { mutuallyExclusive: true };
      }

      // Case 3: Only one field has a value -> VALID
      return null;
    };
  }

  validateRace(group: FormGroup): { [key: string]: any } | null {
    const hasRaceSelected = Object.values(group.value).some((value) => value);
    return hasRaceSelected ? null : { raceRequired: true };
  }

  initialiseSection3() {
    this.empBusTradingForm = this.fb.group({
      employerName: ['', Validators.required],
      businessTelephone: ['', Validators.required],
      businessAddress: ['', Validators.required],
      firmName: ['', Validators.required],
      partnersOrDirectors: ['', Validators.required],
      businessName: ['', Validators.required],
      businessDetails: ['', Validators.required],
      hasTradingPartners: [false],
      tradingPartners: this.fb.array([]),
    });

    this.empBusTradingForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.empBusTradingForm.invalid &&
        Object.keys(this.empBusTradingForm.controls).some(
          (key) =>
            this.empBusTradingForm.get(key)?.touched ||
            this.empBusTradingForm.get(key)?.dirty,
        )
      ) {
        this.group3SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group3SectionText = 'active edit-text';
        this.group3SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.personalInfoForm.valid) {
        this.group3SectionEdit = false;
        this.group3SectionValid = true; // Show check icon if form is valid
        this.group3SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group3SectionEdit = false;
        this.group3SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  get tradingPartners(): FormArray {
    return this.empBusTradingForm.get('tradingPartners') as FormArray;
  }

  toggleTradingPartners(event: Event): void {
    this.hasTradingPartners = (event.target as HTMLInputElement).checked;

    if (this.hasTradingPartners && this.tradingPartners.length === 0) {
      this.addTradingPartner(); // Add one field by default
      this.autocompleteInitialized = false;
      this.initializeAutocompleteIfNeeded();
    } else if (!this.hasTradingPartners) {
      this.tradingPartners.clear(); // Clear all entries
    }
  }

  addTradingPartner(): void {
    const partnerGroup = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
    });
    this.tradingPartners.push(partnerGroup);
    this.autocompleteInitialized = false;
    this.initializeAutocompleteIfNeeded();
  }

  removeTradingPartner(index: number): void {
    this.tradingPartners.removeAt(index);
  }

  initialiseSection4() {
    this.businessDetailsOfficeForm = this.fb.group({
      proofOfRental: ['', Validators.required],
      staffDetails: ['', Validators.required],
      numComputers: ['', Validators.required],
      numPrinters: ['', Validators.required],
      additionalInfo: ['', Validators.required],
    });

    this.businessDetailsOfficeForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.businessDetailsOfficeForm.invalid &&
        Object.keys(this.businessDetailsOfficeForm.controls).some(
          (key) =>
            this.businessDetailsOfficeForm.get(key)?.touched ||
            this.businessDetailsOfficeForm.get(key)?.dirty,
        )
      ) {
        this.group4SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group4SectionText = 'active edit-text';
        this.group4SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.businessDetailsOfficeForm.valid) {
        this.group4SectionEdit = false;
        this.group4SectionValid = true; // Show check icon if form is valid
        this.group4SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group4SectionEdit = false;
        this.group4SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });

    this.businessAdressDetailsForm = this.fb.group({
      provinceOfficeAddress1: ['', Validators.required],
      provinceDetails1: ['', Validators.required],
      provinceOfficeAddress2: [''],
      provinceDetails2: [''],
      provinceOfficeAddress3: [''],
      provinceDetails3: [''],
    });

    this.businessAdressDetailsForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.businessAdressDetailsForm.invalid &&
        Object.keys(this.businessAdressDetailsForm.controls).some(
          (key) =>
            this.businessAdressDetailsForm.get(key)?.touched ||
            this.businessAdressDetailsForm.get(key)?.dirty,
        )
      ) {
        this.group4SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group4SectionText = 'active edit-text';
        this.group4SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.businessAdressDetailsForm.valid) {
        this.group4SectionEdit = false;
        this.group4SectionValid = true; // Show check icon if form is valid
        this.group4SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group4SectionEdit = false;
        this.group4SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  initialiseSection5() {
    this.qualProMembershipForm = this.fb.group({
      qualifications: ['', Validators.required],
      professionalMemberships: ['', Validators.required],
      professionalMembershipsFile: ['', Validators.required],
      qualificationFile: ['', Validators.required],
    });

    this.qualProMembershipForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.qualProMembershipForm.invalid &&
        Object.keys(this.qualProMembershipForm.controls).some(
          (key) =>
            this.qualProMembershipForm.get(key)?.touched ||
            this.qualProMembershipForm.get(key)?.dirty,
        )
      ) {
        this.group5SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group5SectionText = 'active edit-text';
        this.group5SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.qualProMembershipForm.valid) {
        this.group5SectionEdit = false;
        this.group5SectionValid = true; // Show check icon if form is valid
        this.group5SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group5SectionEdit = false;
        this.group5SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  initialiseSection6() {
    this.disqualRelationshipForm = this.fb.group({
      disqualification: [''],
      relationshipDisclosure: [''],
      relationshipDetails: [''],
      relationshipCity: [''],
    });

    this.handleRelationshipChange();

    this.disqualRelationshipForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.disqualRelationshipForm.invalid &&
        Object.keys(this.disqualRelationshipForm.controls).some(
          (key) =>
            this.disqualRelationshipForm.get(key)?.touched ||
            this.disqualRelationshipForm.get(key)?.dirty,
        )
      ) {
        this.group6SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group6SectionText = 'active edit-text';
        this.group6SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.disqualRelationshipForm.valid) {
        this.group6SectionEdit = false;
        this.group6SectionValid = true; // Show check icon if form is valid
        this.group6SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group6SectionEdit = false;
        this.group6SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  handleRelationshipChange(): void {
    this.disqualRelationshipForm
      .get('relationshipDisclosure')
      ?.valueChanges.subscribe((value) => {
        const relationshipDetailsControl = this.disqualRelationshipForm.get(
          'relationshipDetails',
        );
        const cityDetailsControl =
          this.disqualRelationshipForm.get('relationshipCity');
        if (value === 'related') {
          // Make relationshipDetails required
          relationshipDetailsControl?.setValidators([Validators.required]);
          cityDetailsControl?.setValidators([Validators.required]);
        } else {
          // Clear validators if not related
          relationshipDetailsControl?.clearValidators();
          relationshipDetailsControl?.reset(); // Optionally reset the field

          cityDetailsControl?.clearValidators();
          cityDetailsControl?.reset(); // Optionally reset the field
        }
        relationshipDetailsControl?.updateValueAndValidity(); // Update validation state
        cityDetailsControl?.updateValueAndValidity(); // Update validation state
      });
  }

  initialiseSection8() {
    this.taxBondBankForm = this.fb.group({
      taxClearance: ['', Validators.required],
      bankAccountDocumentation: ['', Validators.required],
      declaration: ['', Validators.required],
      bondFacility: ['', Validators.required],
    });

    this.taxBondBankForm.get('declaration').disable();

    this.taxBondBankForm.statusChanges.subscribe(() => {
      if (
        this.taxBondBankForm.invalid &&
        Object.keys(this.taxBondBankForm.controls).some(
          (key) =>
            this.taxBondBankForm.get(key)?.touched ||
            this.taxBondBankForm.get(key)?.dirty,
        )
      ) {
        this.group8SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group8SectionText = 'active edit-text';
        this.group8SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.taxBondBankForm.valid) {
        this.group8SectionEdit = false;
        this.group8SectionValid = true; // Show check icon if form is valid
        this.group8SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group8SectionEdit = false;
        this.group8SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  initialiseSection7() {
    this.appEmpHistoryForm = this.fb.group({
      appointmentLocations: ['', Validators.required],
      employmentHistory: ['', Validators.required],
      CurriculumVitae: ['', Validators.required],
    });

    this.appEmpHistoryForm.statusChanges.subscribe(() => {
      // Check if the form is invalid and any control is dirty or touched
      if (
        this.appEmpHistoryForm.invalid &&
        Object.keys(this.appEmpHistoryForm.controls).some(
          (key) =>
            this.appEmpHistoryForm.get(key)?.touched ||
            this.appEmpHistoryForm.get(key)?.dirty,
        )
      ) {
        this.group7SectionEdit = true; // Show edit icon if form is touched/dirty and invalid
        this.group7SectionText = 'active edit-text';
        this.group7SectionValid = false;
        this.cdr.detectChanges();
      } else if (this.appEmpHistoryForm.valid) {
        this.group7SectionEdit = false;
        this.group7SectionValid = true; // Show check icon if form is valid
        this.group7SectionText = 'active valid-text';
        this.cdr.detectChanges();
      } else {
        this.group7SectionEdit = false;
        this.group7SectionValid = false; // Reset to default state
        this.cdr.detectChanges();
      }
    });
  }

  get f() {
    return this.personalInfoForm.controls;
  }

  get g() {
    return this.businessForm.controls;
  }

  getAppication() {
    this.loading = true; // Start loading indicator

    this.liquidatorApplicationService
      .getApplication(this.userRole.userId)
      .subscribe(
        (application) => {
          if (application) {
            this.applicationId = application.application_id;
            localStorage.setItem(
              'applicationId',
              JSON.stringify(this.applicationId),
            );

            // Ensure all sections load before continuing
            this.getSectionDetails().then(() => {
              this.patchPersonalInfoForm();
              // this.moveGroupTwoSection();
              this.loading = false; // Stop loading after all tasks complete
            });
          } else {
            this.loading = false; // Stop loading if no application is found
          }
        },
        (error) => {
          this.toastr.error(error.error?.message, 'Error');
          this.loading = false; // Stop loading on error
        },
      );
  }

  async getSectionDetails() {
    if (!this.applicationId) return;

    const sectionRequests = [];

    for (let index = 1; index <= 9; index++) {
      sectionRequests.push(
        this.liquidatorApplicationService
          .getSectionDetails(this.applicationId, index)
          .toPromise()
          .then((section) => {
            if (section) {
              localStorage.setItem(
                `section${index}Details`,
                JSON.stringify(section),
              );
            }
          })
          .catch((error) => {
            console.error(`Error fetching section ${index} details`, error);
          }),
      );
    }

    await Promise.all(sectionRequests);
  }

  getPartnerDetails() {
    if (this.applicationId) {
      this.liquidatorApplicationService
        .getTradingPartners(this.applicationId)
        .subscribe(
          (partner) => {
            if (partner) {
              this.partDetails = partner;
              localStorage.setItem(
                `partnerDetails`,
                JSON.stringify(this.partDetails),
              );

              //  this.moveGroupTwoSection();
            }
          },
          (error) => {},
        );
    }
  }

  PersonalInformationSubmit(): void {
    if (this.personalInfoForm.valid) {
      this.createApplication(this.userRole.userId);
    } else {
      Object.keys(this.personalInfoForm.controls).forEach((controlName) => {
        const control = this.personalInfoForm.get(controlName);
        control?.markAsTouched();
      });
    }
  }

  editSection() {
    if (this.personalInfoForm.valid) {
      const formData = new FormData();
      formData.append('full_name', this.personalInfoForm.get('fullName').value);
      formData.append(
        'identity_number',
        this.personalInfoForm.get('identityNumber').value,
      );
      formData.append('race', this.personalInfoForm.get('race').value);
      formData.append('gender', this.personalInfoForm.get('gender').value);
      formData.append('id_document_file_name', this.FileName);
      formData.append('id_document_file', this.File); // Ensure the file is added as Blob

      this.liquidatorApplicationService
        .editSection(this.applicationId, 1, formData)
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section1Details = response.data;
              localStorage.setItem(
                'section1Details',
                JSON.stringify(this.section1Details),
              );
              this.patchPersonalInfoForm();
              this.toastr.success(response.message, 'Success');
              this.moveGroupTwoSection();
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.personalInfoForm.controls).forEach((controlName) => {
        const control = this.personalInfoForm.get(controlName);
        control?.markAsTouched();
      });
    }
  }

  editSection2() {
    if (this.businessForm.valid) {
      this.liquidatorApplicationService
        .editSection2(this.applicationId, 2, {
          business_type: this.businessForm.get('businessType').value,
          business_status: this.businessForm.get('businessStatus').value,
        })
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section2Details = response.data;
              localStorage.setItem(
                'section2Details',
                JSON.stringify(this.section2Details),
              );
              this.patchVerificationBusiness();
              this.toastr.success(response.message, 'Sucess');
              this.moveGroupThreeSection();
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.businessForm.controls).forEach((controlName) => {
        const control = this.businessForm.get(controlName);
        control?.markAsTouched();
      });
    }
  }

  businessInfoSubmit(): void {
    if (this.businessForm.valid) {
      // Proceed with valid form submission
      this.liquidatorApplicationService
        .updateSection(this.applicationId, 2, {
          business_type: this.businessForm.get('businessType')?.value,
          business_status: this.businessForm.get('businessStatus')?.value,
        })
        .subscribe({
          next: (businessInfo) => {
            if (businessInfo.statusCode === 200) {
              this.section2Details = businessInfo.data;
              localStorage.setItem(
                'section2Details',
                JSON.stringify(this.section2Details),
              );
              this.patchVerificationBusiness();
              this.toastr.success(businessInfo.message, 'Success');
              this.group2SectionValid = true;
              this.moveGroupThreeSection();
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            this.toastr.error(
              error.error?.message || 'An error occurred',
              'Error',
            );
          },
        });
    } else {
      // If the form is invalid, mark controls as touched and log invalid controls
      this.group2SectionEdit = true;
      this.group2SectionText = 'active edit-text';
      this.group2SectionValid = false;

      // Mark all controls as touched
      Object.keys(this.businessForm.controls).forEach((controlName) => {
        const control = this.businessForm.get(controlName);
        control?.markAsTouched();
      });

      // Log invalid controls
      const invalidControls = this.getInvalidControls();
      console.warn('Invalid controls:', invalidControls);
    }
  }

  /**
   * Helper method to get invalid controls with their errors
   */
  getInvalidControls(): { controlName: string; errors: any }[] {
    return Object.keys(this.businessForm.controls)
      .map((controlName) => {
        const control = this.businessForm.get(controlName);
        return {
          controlName,
          errors: control?.errors || null,
        };
      })
      .filter((control) => control.errors); // Filter only controls with errors
  }

  empBusTradingSubmit(): void {
    if (this.empBusTradingForm.valid) {
      this.liquidatorApplicationService
        .updateSection(this.applicationId, 3, {
          employer_name: this.empBusTradingForm.get('employerName').value,
          business_telephone:
            this.empBusTradingForm.get('businessTelephone').value,
          business_address: this.empBusTradingForm.get('businessAddress').value,
          firm_name: this.empBusTradingForm.get('firmName').value,
          partners_or_directors: this.empBusTradingForm.get(
            'partnersOrDirectors',
          ).value,
          business_name: this.empBusTradingForm.get('businessName').value,
          business_details: this.empBusTradingForm.get('businessDetails').value,
          hasTradingPartners: this.hasTradingPartners,
          //  trading_partners: this.empBusTradingForm.get('tradingPartners').value
        })
        .subscribe({
          next: (employment) => {
            if (employment.statusCode === 200) {
              // test

              this.liquidatorApplicationService
                .addTradingPartners(
                  this.applicationId,
                  this.empBusTradingForm.get('tradingPartners').value,
                )
                .subscribe((partners) => {
                  if (partners) {
                    this.section3Details = employment.data;
                    localStorage.setItem(
                      'section3Details',
                      JSON.stringify(this.section3Details),
                    );
                    this.getPartnerDetails();
                    localStorage.setItem(
                      `partnerDetails`,
                      JSON.stringify(this.partDetails),
                    );
                    this.patchempBusTrading();
                    this.toastr.success(employment.message, 'Sucess');
                    this.group3SectionValid = true;
                    this.cdr.detectChanges();
                    this.moveGroupFourSection();
                  }
                });

              // test
            }
          },
          error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
          },
          complete: () => {},
        });
      //  this.moveGroupFourSection();
    } else if (
      this.empBusTradingForm.invalid &&
      Object.keys(this.empBusTradingForm.controls).some(
        (key) =>
          this.empBusTradingForm.get(key)?.touched ||
          this.empBusTradingForm.get(key)?.dirty,
      )
    ) {
      this.group3SectionEdit = true;
      this.group3SectionText = 'active edit-text';
      this.group3SectionValid = false;
    } else {
      Object.keys(this.empBusTradingForm.controls).forEach((controlName) => {
        const controlB = this.empBusTradingForm.get(controlName);
        controlB?.markAsTouched();
      });
    }
  }

  editSection3() {
    if (this.businessForm.valid) {
      this.liquidatorApplicationService
        .editSection2(this.applicationId, 3, {
          employer_name: this.empBusTradingForm.get('employerName').value,
          business_telephone:
            this.empBusTradingForm.get('businessTelephone').value,
          business_address: this.empBusTradingForm.get('businessAddress').value,
          firm_name: this.empBusTradingForm.get('firmName').value,
          partners_or_directors: this.empBusTradingForm.get(
            'partnersOrDirectors',
          ).value,
          business_name: this.empBusTradingForm.get('businessName').value,
          business_details: this.empBusTradingForm.get('businessDetails').value,
          hasTradingPartners:
            this.empBusTradingForm.get('hasTradingPartners').value,
        })
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.liquidatorApplicationService
                .updateTradingPartners(
                  this.applicationId,
                  this.empBusTradingForm.get('tradingPartners').value,
                )
                .subscribe((update) => {
                  if (update && update.statusCode === 200) {
                    this.section3Details = response.data;
                    localStorage.setItem(
                      'section3Details',
                      JSON.stringify(this.section3Details),
                    );
                    localStorage.setItem(
                      `partnerDetails`,
                      JSON.stringify(update.tradingPartners),
                    );
                    this.patchempBusTrading();
                    this.toastr.success(response.message, 'Sucess');
                    this.moveGroupFourSection();
                  }
                });
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.empBusTradingForm.controls).forEach((controlName) => {
        const control = this.businessForm.get(controlName);
        control?.markAsTouched();
      });
    }
  }

  businessDetailsOfficeSubmit(): void {
    if (
      this.businessDetailsOfficeForm.valid &&
      this.businessAdressDetailsForm.valid
    ) {
      this.liquidatorApplicationService
        .updateSection(this.applicationId, 4, {
          proof_of_rental:
            this.businessDetailsOfficeForm.get('proofOfRental').value,
          staff_details:
            this.businessDetailsOfficeForm.get('staffDetails').value,
          num_computers:
            this.businessDetailsOfficeForm.get('numComputers').value,
          num_printers: this.businessDetailsOfficeForm.get('numPrinters').value,
          additional_info:
            this.businessDetailsOfficeForm.get('additionalInfo').value,
        })
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section4Details = response.data;
              localStorage.setItem(
                'section4Details',
                JSON.stringify(this.section4Details),
              );
              this.liquidatorApplicationService
                .updateSection(this.applicationId, 5, {
                  province1: this.businessAdressDetailsForm.get(
                    'provinceOfficeAddress1',
                  ).value,
                  address1:
                    this.businessAdressDetailsForm.get('provinceDetails1')
                      .value,
                  province2: this.businessAdressDetailsForm.get(
                    'provinceOfficeAddress2',
                  ).value,
                  address2:
                    this.businessAdressDetailsForm.get('provinceDetails2')
                      .value,
                  province3: this.businessAdressDetailsForm.get(
                    'provinceOfficeAddress3',
                  ).value,
                  address3:
                    this.businessAdressDetailsForm.get('provinceDetails3')
                      .value,
                })
                .subscribe(
                  (response) => {
                    if (response.statusCode === 200) {
                      this.section5Details = response.data;
                      localStorage.setItem(
                        'section5Details',
                        JSON.stringify(this.section5Details),
                      );
                      this.patchbusinessDetailsOffice();
                      this.toastr.success(response.message, 'Sucess');
                      this.group4SectionValid = true;
                      this.moveGroupFiveSection();
                    }
                  },
                  (error) => {
                    this.toastr.error(error.error?.message, 'Error');
                    // Handle error here (e.g., show an error message)
                  },
                );
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else if (
      this.businessDetailsOfficeForm.invalid &&
      Object.keys(this.businessDetailsOfficeForm.controls).some(
        (key) =>
          this.businessDetailsOfficeForm.get(key)?.touched ||
          this.businessDetailsOfficeForm.get(key)?.dirty,
      )
    ) {
      this.group4SectionEdit = true;
      this.group4SectionText = 'active edit-text';
      this.group4SectionValid = false;
    } else {
      Object.keys(this.businessDetailsOfficeForm.controls).forEach(
        (controlName) => {
          const controlB = this.businessDetailsOfficeForm.get(controlName);
          controlB?.markAsTouched();
        },
      );
    }
  }

  editSection4() {
    if (
      this.businessDetailsOfficeForm.valid &&
      this.businessAdressDetailsForm.valid
    ) {
      this.liquidatorApplicationService
        .editSection2(this.applicationId, 4, {
          proof_of_rental:
            this.businessDetailsOfficeForm.get('proofOfRental').value,
          staff_details:
            this.businessDetailsOfficeForm.get('staffDetails').value,
          num_computers:
            this.businessDetailsOfficeForm.get('numComputers').value,
          num_printers: this.businessDetailsOfficeForm.get('numPrinters').value,
          additional_info:
            this.businessDetailsOfficeForm.get('additionalInfo').value,
        })
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section4Details = response.data;
              localStorage.setItem(
                'section4Details',
                JSON.stringify(this.section4Details),
              );
              this.liquidatorApplicationService
                .editSection2(this.applicationId, 5, {
                  province1: this.businessAdressDetailsForm.get(
                    'provinceOfficeAddress1',
                  ).value,
                  address1:
                    this.businessAdressDetailsForm.get('provinceDetails1')
                      .value,
                  province2: this.businessAdressDetailsForm.get(
                    'provinceOfficeAddress2',
                  ).value,
                  address2:
                    this.businessAdressDetailsForm.get('provinceDetails2')
                      .value,
                  province3: this.businessAdressDetailsForm.get(
                    'provinceOfficeAddress3',
                  ).value,
                  address3:
                    this.businessAdressDetailsForm.get('provinceDetails3')
                      .value,
                })
                .subscribe(
                  (response) => {
                    if (response.statusCode === 200) {
                      this.section5Details = response.data;
                      localStorage.setItem(
                        'section5Details',
                        JSON.stringify(this.section5Details),
                      );
                      this.patchbusinessDetailsOffice();
                      this.toastr.success(response.message, 'Sucess');
                      this.group4SectionValid = true;
                      this.moveGroupFiveSection();
                    }
                  },
                  (error) => {
                    this.toastr.error(error.error?.message, 'Error');
                    // Handle error here (e.g., show an error message)
                  },
                );
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.businessDetailsOfficeForm.controls).forEach(
        (controlName) => {
          const control = this.businessDetailsOfficeForm.get(controlName);
          control?.markAsTouched();
        },
      );

      Object.keys(this.businessAdressDetailsForm.controls).forEach(
        (controlName) => {
          const control = this.businessAdressDetailsForm.get(controlName);
          control?.markAsTouched();
        },
      );
    }
  }

  qualProMembershipSubmit(): void {
    if (this.qualProMembershipForm.valid) {
      const formData = new FormData();
      formData.append(
        'qualifications',
        this.qualProMembershipForm.get('qualifications').value,
      );
      formData.append(
        'professional_memberships',
        this.qualProMembershipForm.get('professionalMemberships').value,
      );
      formData.append('membership_file_name', this.membership_file_name);
      formData.append('membership_file', this.membership_file);
      formData.append(
        'qualification_file_name',
        this.qualificationFile_file_name,
      );
      formData.append('qualification_file', this.qualificationFile_file);

      this.liquidatorApplicationService
        .updateSection2(this.applicationId, 6, formData)
        .subscribe({
          next: (employment) => {
            if (employment.statusCode === 200) {
              this.section6Details = employment.data;
              localStorage.setItem(
                'section6Details',
                JSON.stringify(this.section6Details),
              );
              this.patchQualProMembership();
              this.toastr.success(employment.message, 'Sucess');
              this.group5SectionValid = true;
              this.cdr.detectChanges();
              this.moveGroupSixSection();
            }
          },
          error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
          },
          complete: () => {},
        });
    } else if (
      this.qualProMembershipForm.invalid &&
      Object.keys(this.qualProMembershipForm.controls).some(
        (key) =>
          this.qualProMembershipForm.get(key)?.touched ||
          this.qualProMembershipForm.get(key)?.dirty,
      )
    ) {
      this.group5SectionEdit = true;
      this.group5SectionText = 'active edit-text';
      this.group5SectionValid = false;
    } else {
      Object.keys(this.qualProMembershipForm.controls).forEach(
        (controlName) => {
          const controlB = this.qualProMembershipForm.get(controlName);
          controlB?.markAsTouched();
        },
      );
    }
  }

  editSection5() {
    if (this.qualProMembershipForm.valid) {
      const formData = new FormData();
      formData.append(
        'qualifications',
        this.qualProMembershipForm.get('qualifications').value,
      );
      formData.append(
        'professional_memberships',
        this.qualProMembershipForm.get('professionalMemberships').value,
      );
      formData.append('membership_file_name', this.membership_file_name);
      formData.append('membership_file', this.membership_file);
      formData.append(
        'qualification_file_name',
        this.qualificationFile_file_name,
      );
      formData.append('qualification_file', this.qualificationFile_file);

      this.liquidatorApplicationService
        .editSection(this.applicationId, 6, formData)
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section6Details = response.data;
              localStorage.setItem(
                'section6Details',
                JSON.stringify(this.section6Details),
              );
              this.patchbusinessDetailsOffice();
              this.toastr.success(response.message, 'Sucess');
              this.group4SectionValid = true;
              this.moveGroupFiveSection();
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.businessDetailsOfficeForm.controls).forEach(
        (controlName) => {
          const control = this.businessDetailsOfficeForm.get(controlName);
          control?.markAsTouched();
        },
      );

      Object.keys(this.businessAdressDetailsForm.controls).forEach(
        (controlName) => {
          const control = this.businessAdressDetailsForm.get(controlName);
          control?.markAsTouched();
        },
      );
    }
  }

  disqualRelationshipSubmit(): void {
    if (this.disqualRelationshipForm.valid) {
      this.liquidatorApplicationService
        .updateSection(this.applicationId, 7, {
          disqualification_details:
            this.disqualRelationshipForm.get('disqualification').value,
          relationship_disclosure: this.disqualRelationshipForm.get(
            'relationshipDisclosure',
          ).value,
          relationship_details: this.disqualRelationshipForm.get(
            'relationshipDetails',
          ).value,
          relationship_city:
            this.disqualRelationshipForm.get('relationshipCity').value,
        })
        .subscribe({
          next: (disqualification) => {
            if (disqualification.statusCode === 200) {
              this.section7Details = disqualification.data;
              localStorage.setItem(
                'section7Details',
                JSON.stringify(this.section7Details),
              );
              // this.patchQualProMembership();
              this.toastr.success(disqualification.message, 'Sucess');
              this.group6SectionValid = true;
              this.cdr.detectChanges();
              this.moveGroupSevenSection();
            }
          },
          error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
          },
          complete: () => {},
        });
    } else if (
      this.disqualRelationshipForm.invalid &&
      Object.keys(this.disqualRelationshipForm.controls).some(
        (key) =>
          this.disqualRelationshipForm.get(key)?.touched ||
          this.disqualRelationshipForm.get(key)?.dirty,
      )
    ) {
      this.group6SectionEdit = true;
      this.group6SectionText = 'active edit-text';
      this.group6SectionValid = false;
    } else {
      Object.keys(this.disqualRelationshipForm.controls).forEach(
        (controlName) => {
          const controlB = this.disqualRelationshipForm.get(controlName);
          controlB?.markAsTouched();
        },
      );
    }
  }

  editSection6() {
    if (this.disqualRelationshipForm.valid) {
      this.liquidatorApplicationService
        .editSection2(this.applicationId, 7, {
          disqualification_details:
            this.disqualRelationshipForm.get('disqualification').value,
          relationship_disclosure: this.disqualRelationshipForm.get(
            'relationshipDisclosure',
          ).value,
          relationship_details: this.disqualRelationshipForm.get(
            'relationshipDetails',
          ).value,
          relationship_city:
            this.disqualRelationshipForm.get('relationshipCity').value,
        })
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section7Details = response.data;
              localStorage.setItem(
                'section7Details',
                JSON.stringify(this.section7Details),
              );
              this.patchDisqualRelationship();
              this.toastr.success(response.message, 'Sucess');
              this.group6SectionValid = true;
              this.moveGroupSevenSection();
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.businessDetailsOfficeForm.controls).forEach(
        (controlName) => {
          const control = this.businessDetailsOfficeForm.get(controlName);
          control?.markAsTouched();
        },
      );

      Object.keys(this.businessAdressDetailsForm.controls).forEach(
        (controlName) => {
          const control = this.businessAdressDetailsForm.get(controlName);
          control?.markAsTouched();
        },
      );
    }
  }

  onCheckboxChange(event: any) {
    const value = event.target.value;

    if (event.target.checked) {
      // Add the value to the array if checked
      if (!this.selectedAppointmentLocations.includes(value)) {
        this.selectedAppointmentLocations.push(value);
        console.log(this.selectedAppointmentLocations);
      }
    } else {
      // Remove the value from the array if unchecked
      this.selectedAppointmentLocations =
        this.selectedAppointmentLocations.filter(
          (location) => location !== value,
        );
    }

    console.log(this.selectedAppointmentLocations); // Debugging: See the current selection
  }

  appEmpHistorySubmit(): void {
    if (this.appEmpHistoryForm.valid) {
      const formData = new FormData();
      formData.append(
        'appointment_locations',
        JSON.stringify(this.selectedAppointmentLocations),
      );
      formData.append(
        'employment_history',
        this.appEmpHistoryForm.get('employmentHistory').value,
      );
      formData.append('curriculum_vitae_file_name', this.csFileName);
      formData.append('curriculum_vitae_file', this.cvFile);

      this.liquidatorApplicationService
        .updateSection2(this.applicationId, 8, formData)
        .subscribe({
          next: (employment) => {
            if (employment.statusCode === 200) {
              this.section8Details = employment.data;
              localStorage.setItem(
                'section8Details',
                JSON.stringify(this.section8Details),
              );
              // this.patchQualProMembership();
              this.toastr.success(employment.message, 'Sucess');
              this.group7SectionValid = true;
              this.cdr.detectChanges();
              this.moveGroupEightSection();
            }
          },
          error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
          },
          complete: () => {},
        });
    } else if (
      this.appEmpHistoryForm.invalid &&
      Object.keys(this.appEmpHistoryForm.controls).some(
        (key) =>
          this.appEmpHistoryForm.get(key)?.touched ||
          this.appEmpHistoryForm.get(key)?.dirty,
      )
    ) {
      this.group7SectionEdit = true;
      this.group7SectionText = 'active edit-text';
      this.group7SectionValid = false;
    } else {
      Object.keys(this.appEmpHistoryForm.controls).forEach((controlName) => {
        const controlB = this.appEmpHistoryForm.get(controlName);
        controlB?.markAsTouched();
      });
    }
  }

  editSection7() {
    if (this.appEmpHistoryForm.valid) {
      const formData = new FormData();
      formData.append(
        'appointment_locations',
        JSON.stringify(this.selectedAppointmentLocations),
      );
      formData.append(
        'employment_history',
        this.appEmpHistoryForm.get('employmentHistory').value,
      );
      formData.append('curriculum_vitae_file_name', this.csFileName);
      formData.append('curriculum_vitae_file', this.cvFile);

      this.liquidatorApplicationService
        .editSection(this.applicationId, 8, formData)
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section8Details = response.data;
              localStorage.setItem(
                'section8Details',
                JSON.stringify(this.section8Details),
              );
              this.patchbusinessDetailsOffice();
              this.toastr.success(response.message, 'Sucess');
              this.group7SectionValid = true;
              this.moveGroupEightSection();
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.businessDetailsOfficeForm.controls).forEach(
        (controlName) => {
          const control = this.businessDetailsOfficeForm.get(controlName);
          control?.markAsTouched();
        },
      );

      Object.keys(this.businessAdressDetailsForm.controls).forEach(
        (controlName) => {
          const control = this.businessAdressDetailsForm.get(controlName);
          control?.markAsTouched();
        },
      );
    }
  }

  taxBondBankSubmit(): void {
    if (this.taxBondBankForm.valid) {
      const declarationValue = this.taxBondBankForm.get('declaration').value
        ? '1'
        : '0';
      const formData = new FormData();
      formData.append('tax_clearance_certificate_file', this.TaxClearanceFile);
      formData.append(
        'tax_clearance_certificate_file_name',
        this.TaxClearanceFileName,
      );
      formData.append('bank_account_proof_file', this.bankAccountFile);
      formData.append('bank_account_proof_file_name', this.bankAccountFileName);
      formData.append('bond_facility_file', this.bondFacilityFile);
      formData.append('bond_facility_file_name', this.bondFacilityFileName);
      formData.append('declaration_agreement', declarationValue);

      this.liquidatorApplicationService
        .updateSection2(this.applicationId, 9, formData)
        .subscribe({
          next: (tax) => {
            if (tax.statusCode === 200) {
              this.section9Details = tax.data;
              localStorage.setItem(
                'section9Details',
                JSON.stringify(this.section9Details),
              );
              // this.patchQualProMembership();
              this.patchTaxBondBank();
              this.toastr.success(tax.message, 'Sucess');
              this.group8SectionValid = true;
              this.group8SectionEdit = false;
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            this.toastr.error(error.error?.message, 'Error');
          },
          complete: () => {},
        });
    } else if (
      this.taxBondBankForm.invalid &&
      Object.keys(this.taxBondBankForm.controls).some(
        (key) =>
          this.taxBondBankForm.get(key)?.touched ||
          this.taxBondBankForm.get(key)?.dirty,
      )
    ) {
      this.group8SectionEdit = true;
      this.group8SectionText = 'active edit-text';
      this.group8SectionValid = false;
    } else {
      Object.keys(this.taxBondBankForm.controls).forEach((controlName) => {
        const controlB = this.taxBondBankForm.get(controlName);
        controlB?.markAsTouched();
      });
    }
  }

  editSection8() {
    if (this.taxBondBankForm.valid) {
      const declarationValue = this.taxBondBankForm.get('declaration').value
        ? '1'
        : '0';
      const formData = new FormData();
      formData.append('tax_clearance_certificate_file', this.TaxClearanceFile);
      formData.append(
        'tax_clearance_certificate_file_name',
        this.TaxClearanceFileName,
      );
      formData.append('bank_account_proof_file', this.bankAccountFile);
      formData.append('bank_account_proof_file_name', this.bankAccountFileName);
      formData.append('bond_facility_file', this.bondFacilityFile);
      formData.append('bond_facility_file_name', this.bondFacilityFileName);
      formData.append('declaration_agreement', declarationValue);

      this.liquidatorApplicationService
        .editSection(this.applicationId, 9, formData)
        .subscribe(
          (response) => {
            if (response.statusCode === 200) {
              this.section9Details = response.data;
              localStorage.setItem(
                'section9Details',
                JSON.stringify(this.section9Details),
              );
              this.patchTaxBondBank();
              this.toastr.success(response.message, 'Sucess');
              this.group8SectionValid = true;
            }
          },
          (error) => {
            this.toastr.error(error.error?.message, 'Error');
            // Handle error here (e.g., show an error message)
          },
        );
    } else {
      Object.keys(this.taxBondBankForm.controls).forEach((controlName) => {
        const control = this.taxBondBankForm.get(controlName);
        control?.markAsTouched();
      });

      Object.keys(this.taxBondBankForm.controls).forEach((controlName) => {
        const control = this.taxBondBankForm.get(controlName);
        control?.markAsTouched();
      });
    }
  }

  updateStatus(status: string) {
    const statusUpdate = {
      review_status: status,
      /*       outcome: '',
      reviewer_id: '',
      tax_clearance_private: '',
      tax_clearance_business: '',
      bond_facility: '',
      banking_details: '',
      lease_agreement: '',
      id_document: '',
      further_comments: '', */
    };

    this.liquidatorApplicationService
      .submitDeclarationForm(this.applicationId, statusUpdate)
      .subscribe({
        next: (response) => {
          console.log('Application status updated successfully:', response);
        },
        error: (err) => {
          console.error('Error updating application status:', err);
        },
      });
  }

  updateDeclarationStatus(): void {
    const statusData = {
      review_status: 'Submitted',
    };

    this.liquidatorApplicationService
      .updateDeclarationForm(this.applicationId, statusData)
      .subscribe(
        (response) => {
          this.checkFormCompletion();
          this.toastr.success(response.message, 'Success');
          this.ngOnInit();
        },
        (error) => {
          console.error('Error updating status:', error);
        },
      );
  }

  generatePDF() {
    const data = document.getElementById('a4'); // ID of the HTML element to capture

    if (data) {
      html2canvas(data).then((canvas) => {
        const imgWidth = 208; // A4 size in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); // A4 size PDF
        let position = 0;

        pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save('generated-pdf.pdf'); // Save the PDF
      });
    }
  }

  initializeSections() {
    for (let i = 1; i <= 8; i++) {
      this[`group${i}Section`] = false;
      this[`group${i}SectionText`] = '';
      this[`group${i}SectionCircle`] = '';
      this[`group${i}SectionEdit`] = false;
      this[`group${i}SectionValid`] = false;
    }
  }

  setActiveSection(sectionNumber) {
    // Reset all groups to false and clear text and circle classes
    for (let i = 1; i <= 8; i++) {
      this[`group${i}Section`] = false;
      this[`group${i}SectionText`] = '';
      this[`group${i}SectionCircle`] = '';
    }

    // Activate the selected section
    this[`group${sectionNumber}Section`] = true;
    this[`group${sectionNumber}SectionText`] = 'active active-text';
    this[`group${sectionNumber}SectionCircle`] = 'active-circle';
  }

  // Methods for each section
  moveGroupOneSection() {
    this.setActiveSection(1);
    this.currentStep = 1;
    this.cdr.detectChanges();
  }
  moveGroupTwoSection() {
    this.setActiveSection(2);
    this.currentStep = 2;
    this.cdr.detectChanges();
  }
  moveGroupThreeSection() {
    this.setActiveSection(3);
    this.currentStep = 3;
    this.cdr.detectChanges();
    this.initializeAutocompleteIfNeeded();
  }

  onGroupThreeStepClick(): void {
    this.autocompleteInitialized = false;
    this.moveGroupThreeSection(); // Move to group three section
    // Reset the autocomplete initialization flag
  }

  moveGroupFourSection() {
    this.setActiveSection(4);
    this.currentStep = 4;
    this.cdr.detectChanges();
    this.autocompleteInitialized = false;
    this.initializeAutocompleteIfNeeded();
  }

  onGroupFourStepClick(): void {
    this.autocompleteInitialized = false;
    this.moveGroupFourSection(); // Move to group three section
    // Reset the autocomplete initialization flag
  }

  moveGroupFiveSection() {
    this.setActiveSection(5);
    this.currentStep = 5;
    this.cdr.detectChanges();
  }
  moveGroupSixSection() {
    this.setActiveSection(6);
    this.currentStep = 6;
    this.patchDisqualRelationship();
    this.cdr.detectChanges();
  }
  moveGroupSevenSection() {
    this.setActiveSection(7);
    this.currentStep = 7;
    this.patchAppEmpHistory();
    console.log(this.appEmpHistoryForm);
    this.cdr.detectChanges();
  }
  moveGroupEightSection() {
    this.currentStep = 8;
    this.setActiveSection(8);
    this.cdr.detectChanges();
  }

  moveGroupNineSection() {
    this.checkFormCompletion();
    this.currentStep = 9;
    this.setActiveSection(8);

    this.cdr.detectChanges();
  }

  // Back methods can call the same function
  movebackGroupTwoSection() {
    this.setActiveSection(2);
    this.cdr.detectChanges();
  }
  movebackGroupThreeSection() {
    this.setActiveSection(3);
    this.cdr.detectChanges();
    this.initializeAutocompleteIfNeeded();
  }
  movebackGroupFourSection() {
    this.setActiveSection(4);
    this.cdr.detectChanges();
  }
  movebackGroupFiveSection() {
    this.setActiveSection(5);
    this.cdr.detectChanges();
  }
  movebackGroupSixSection() {
    this.setActiveSection(6);
    this.cdr.detectChanges();
  }
  movebackGroupSevenSection() {
    this.setActiveSection(7);

    this.cdr.detectChanges();
  }
  movebackGroupEightSection() {
    this.setActiveSection(8);

    this.cdr.detectChanges();
  }

  // Class property to hold the section 1 details

  createApplication(userId: number) {
    this.liquidatorApplicationService
      .createApplication(userId)
      .pipe(
        switchMap((response) => {
          if (response?.statusCode === 201) {
            this.applicationId = response.applicationId;
            localStorage.setItem(
              'applicationId',
              JSON.stringify(this.applicationId),
            );
            this.toastr.success(response.message, 'Success');

            const formData = new FormData();
            formData.append(
              'full_name',
              this.personalInfoForm.get('fullName').value,
            );
            formData.append(
              'identity_number',
              this.personalInfoForm.get('identityNumber').value,
            );
            formData.append('race', this.personalInfoForm.get('race').value);
            formData.append(
              'gender',
              this.personalInfoForm.get('gender').value,
            );
            formData.append('id_document_file_name', this.FileName);
            formData.append('id_document_file', this.File); // Ensure the file is added as Blob

            return this.liquidatorApplicationService.updateSection2(
              response.applicationId,
              1,
              formData,
            );
          }
          return EMPTY;
        }),
      )
      .subscribe({
        next: (updateResponse: any) => {
          if (updateResponse?.statusCode === 200) {
            this.updateStatus('Draft');
            this.section1Details = updateResponse.data;

            // Save to local storage for persistence
            localStorage.setItem(
              'section1Details',
              JSON.stringify(this.section1Details),
            );

            // Patch the form with section1Details data
            this.patchPersonalInfoForm();

            this.toastr.success(updateResponse.message, 'Success');
            this.moveGroupTwoSection();
          }
        },
        error: (error) => {
          if (error.error?.statusCode !== 400) {
            this.toastr.error(error.error?.message);
          }
        },
      });
  }

  // Helper function to patch the form
  patchPersonalInfoForm() {
    if (this.section1Details) {
      console.log(this.section1Details);
      this.personalInfoForm.patchValue({
        fullName: this.section1Details.full_name,
        identityNumber: this.section1Details.identity_number,
        race: this.section1Details.race,
        gender: this.section1Details.gender,
      });
      this.generateFileLink(this.section1Details);
      // once i have the file need to fix this
      if (!this.idDocumentFileUrl) {
        const control = this.personalInfoForm.get('identityDocument');
        control?.clearValidators();
        control?.updateValueAndValidity();
      }
    }
  }

  patchVerificationBusiness() {
    if (this.section2Details) {
      this.businessForm.patchValue({
        businessType: this.section2Details.business_type,
        businessStatus: this.section2Details.business_status,
      });
    }
  }

  patchempBusTrading() {
    if (this.section3Details && this.partDetails) {
      this.empBusTradingForm.patchValue({
        employerName: this.section3Details.employer_name,
        businessTelephone: this.section3Details.business_telephone,
        businessAddress: this.section3Details.business_address,
        firmName: this.section3Details.firm_name,
        partnersOrDirectors: this.section3Details.partners_or_directors,
        businessName: this.section3Details.business_name,
        businessDetails: this.section3Details.employer_name,
        hasTradingPartners: this.section3Details.hasTradingPartners,
      });

      if (this.section3Details.hasTradingPartners === 1) {
        this.hasTradingPartners = true;
      }

      // Clear existing FormArray
      this.tradingPartners.clear();

      // Patch each partner
      this.partDetails.tradingPartners.forEach((partner) => {
        const partnerGroup = this.fb.group({
          name: [partner.name, Validators.required],
          address: [partner.address, Validators.required],
        });
        this.tradingPartners.push(partnerGroup); // Add to FormArray
      });
    }
  }

  patchbusinessDetailsOffice() {
    if (this.section4Details) {
      this.businessDetailsOfficeForm.patchValue({
        proofOfRental: this.section4Details.proof_of_rental,
        staffDetails: this.section4Details.staff_details,
        numComputers: this.section4Details.num_computers,
        numPrinters: this.section4Details.num_printers,
        additionalInfo: this.section4Details.additional_info,
      });
    }

    if (this.section5Details) {
      this.businessAdressDetailsForm.patchValue({
        provinceOfficeAddress1: this.section5Details.province1,
        provinceDetails1: this.section5Details.address1,
        provinceOfficeAddress2: this.section5Details.province2,
        provinceDetails2: this.section5Details.address2,
        provinceOfficeAddress3: this.section5Details.province3,
        provinceDetails3: this.section5Details.address3,
      });
    }
  }

  patchQualProMembership() {
    if (this.section6Details) {
      this.qualProMembershipForm.patchValue({
        qualifications: this.section6Details.qualifications,
        professionalMemberships: this.section6Details.professional_memberships,
        //   membershipConfirmation: this.section6Details.membership_confirmation_file
      });

      this.generateFileLink(this.section6Details);

      if (this.qualificationFileUrl && this.membershipFileUrl) {
        this.qualProMembershipForm
          .get('professionalMembershipsFile')
          ?.clearValidators();
        this.qualProMembershipForm
          .get('professionalMembershipsFile')
          ?.updateValueAndValidity();

        this.qualProMembershipForm.get('qualificationFile')?.clearValidators();
        this.qualProMembershipForm
          .get('qualificationFile')
          ?.updateValueAndValidity();
      }

      // this.membershipConfirmationFileName = this.section6Details.membership_confirmation_file.split('\\').pop();
      Object.keys(this.qualProMembershipForm.controls).forEach(
        (controlName) => {
          const control = this.qualProMembershipForm.get(controlName);
          if (control) {
            control.clearValidators();
            control.updateValueAndValidity();
          }
        },
      );

      // Update the form's overall validity status
      this.qualProMembershipForm.updateValueAndValidity();
    }
  }

  onNewFileChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;

    console.log('Event Target:', input);
    console.log('Input Files:', input.files);

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected File:', file);

      if (controlName === 'qualificationFile') {
        this.qualificationFile_file_name = file.name;
        this.qualificationFile_file = file; // Assign file
        console.log(
          'Qualification File Name:',
          this.qualificationFile_file_name,
        );
        console.log('Qualification File:', this.qualificationFile_file);
        this.qualProMembershipForm.get(controlName)?.setValue(file);
      }

      if (controlName === 'membershipConfirmationFile') {
        this.membership_file_name = file.name;
        this.membership_file = file; // Assign file
        console.log('Membership File Name:', this.membership_file_name);
        console.log('Membership File:', this.membership_file);
        this.qualProMembershipForm.get(controlName)?.setValue(file);
      }
    } else {
      console.warn('No file selected or files property is empty.');
    }
  }

  patchDisqualRelationship() {
    if (this.section7Details) {
      if (this.section7Details.relationship_disclosure === 'related') {
        this.showRelationshipDetails = true;
      }

      this.disqualRelationshipForm.patchValue({
        disqualification: this.section7Details.disqualification_details,
        relationshipDisclosure: this.section7Details.relationship_disclosure,
        relationshipDetails: this.section7Details.relationship_details,
        relationshipCity: this.section7Details.relationship_city,
      });
    }
  }

  patchAppEmpHistory() {
    if (this.section8Details) {
      // Parse `appointment_locations` from JSON string format
      const appointmentLocations = this.section8Details.appointment_locations
        ? JSON.parse(this.section8Details.appointment_locations)
        : [];

      // Patch employment history
      this.appEmpHistoryForm.patchValue({
        employmentHistory: this.section8Details.employment_history,
      });

      // Manually set the selected locations for the checkboxes
      this.selectedAppointmentLocations = appointmentLocations;

      // Update the checked status of each checkbox based on `selectedAppointmentLocations`
      const checkboxes = document.querySelectorAll(
        'input[type="checkbox"][formControlName="appointmentLocations"]',
      ) as NodeListOf<HTMLInputElement>;

      console.log(checkboxes);

      checkboxes.forEach((checkbox) => {
        console.log(checkbox);
        checkbox.checked = this.selectedAppointmentLocations.includes(
          checkbox.value,
        );
      });

      this.generateFileLink(this.section8Details);

      Object.keys(this.appEmpHistoryForm.controls).forEach((controlName) => {
        const control = this.appEmpHistoryForm.get(controlName);
        if (control) {
          control.clearValidators();
          control.updateValueAndValidity();
        }
      });

      // Update the form's overall validity status
      this.qualProMembershipForm.updateValueAndValidity();
    }
  }

  patchTaxBondBank() {
    if (this.section9Details) {
      this.taxBondBankForm.patchValue({
        taxClearance: this.section9Details.tax_clearance_certificate,
        bankAccountDocumentation: this.section9Details.bank_account_proof,
        declaration: this.section9Details.declaration_agreement === 1,
      });
    }

    Object.keys(this.taxBondBankForm.controls).forEach((controlName) => {
      const control = this.taxBondBankForm.get(controlName);
      if (control) {
        control.clearValidators();
        control.updateValueAndValidity();
      }
    });

    this.generateFileLink(this.section9Details);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      this.qualProMembershipForm.patchValue({ membershipConfirmation: file });
      // Optionally, you could store it in another variable for future use if needed
      this.membershipConfirmationFileName = file;
    }
  }

  getApplication(applicationId: number) {
    this.liquidatorApplicationService.getApplication(applicationId).subscribe({
      next: (response) => console.log('Application details:', response),
      error: (error) => console.error('Error fetching application:', error),
    });
  }

  updateSection(applicationId: number, section: number, data: any) {
    this.liquidatorApplicationService
      .updateSection(applicationId, section, data)
      .subscribe({
        next: (response) =>
          console.log(`Section ${section} updated:`, response),
        error: (error) =>
          console.error(`Error updating section ${section}:`, error),
      });
  }

  submitApplication(applicationId: number) {
    this.liquidatorApplicationService
      .submitApplication(applicationId)
      .subscribe({
        next: (response) => console.log('Application submitted:', response),
        error: (error) => console.error('Error submitting application:', error),
      });
  }

  getReviewStatus(applicationId: number) {
    this.liquidatorApplicationService.getReviewStatus(applicationId).subscribe({
      next: (response) => console.log('Review status:', response),
      error: (error) => console.error('Error fetching review status:', error),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Detect changes to group3Section
    if (
      changes['group3Section'] &&
      this.group3Section &&
      !this.autocompleteInitialized
    ) {
      // Attempt to initialize autocomplete once group3Section becomes true
      this.cdr.detectChanges();
      this.initializeAutocomplete();
      this.autocompleteInitialized = true; // Prevent re-initialization
    }
  }

  initializeAutocompleteIfNeeded() {
    // Only initialize autocomplete if it hasn't been initialized
    if (!this.autocompleteInitialized) {
      this.initializeAutocomplete();
      this.autocompleteInitialized = true; // Prevent re-initialization
    }
  }

  initializeAutocomplete(): void {
    const attemptInitializeAutocomplete = (attemptsLeft: number) => {
      // Define input elements for different forms
      const provinceOfficeAddress1Input = document.getElementById(
        'province-office-address',
      ) as HTMLInputElement;
      const provinceDetails1Input = document.getElementById(
        'province-office-address2',
      ) as HTMLInputElement;
      const provinceOfficeAddress2Input = document.getElementById(
        'province-office-address3',
      ) as HTMLInputElement;
      const businessAddressInput = document.getElementById(
        'business-address',
      ) as HTMLInputElement;

      // Dynamically handle partner addresses
      const partnerAddressInputs = Array.from(
        document.querySelectorAll('[id^="partnerAddress"]'),
      ) as HTMLTextAreaElement[];

      // Helper function to extract province/state
      const getProvinceFromPlace = (
        place: google.maps.places.PlaceResult,
      ): string | null => {
        if (place.address_components) {
          const provinceComponent = place.address_components.find((component) =>
            component.types.includes('administrative_area_level_1'),
          );
          return provinceComponent ? provinceComponent.long_name : null;
        }
        return null;
      };

      // Define inputs and their associated forms
      const inputControls = [
        {
          input: provinceOfficeAddress1Input,
          form: this.businessAdressDetailsForm, // Example form for Province Office Address 1
          formControlName: 'provinceOfficeAddress1',
        },
        {
          input: provinceDetails1Input,
          form: this.businessAdressDetailsForm, // Example form for Province Details
          formControlName: 'provinceOfficeAddress2',
        },
        {
          input: provinceOfficeAddress2Input,
          form: this.businessAdressDetailsForm, // Example form for Province Office Address 2
          formControlName: 'provinceOfficeAddress3',
        },
        {
          input: businessAddressInput,
          form: this.empBusTradingForm, // Example form for Business Address
          formControlName: 'businessAddress',
        },
        // Handle dynamically indexed partner addresses
        ...partnerAddressInputs.map((input, index) => {
          const tradingPartnersFormArray = this.empBusTradingForm.get(
            'tradingPartners',
          ) as FormArray;
          return {
            input,
            form: tradingPartnersFormArray.at(index) as FormGroup, // Get the correct FormGroup from FormArray
            formControlName: 'address', // Address is the control name inside each FormGroup
          };
        }),
      ];
      console.log(inputControls);
      inputControls.forEach(({ input, form, formControlName }) => {
        console.log(input);
        if (input) {
          const autocomplete = new google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'ZA' }, // Restrict to South Africa
            types: ['address'], // Only addresses
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            const province = getProvinceFromPlace(place);

            if (place && place.formatted_address) {
              const fullAddress = province
                ? `${place.formatted_address}, ${province}`
                : place.formatted_address;

              // Update the input value and form control
              input.value = fullAddress;
              const control = form?.get(formControlName);
              if (control) {
                control.setValue(fullAddress, { emitEvent: true });
                control.markAsTouched();
                control.updateValueAndValidity();

                console.log(
                  `Updated Address for ${formControlName} in its form:`,
                  control.value,
                );
              }
            } else {
              console.warn(`No valid place found for ${formControlName}.`);
            }
          });

          // Log changes in the form control
          const control = form?.get(formControlName);
          if (control) {
            control.valueChanges.subscribe((value) => {
              console.log(
                `Control value changed for ${formControlName}:`,
                value,
              );
            });
          }
        } else {
          console.warn(`Input element for ${formControlName} not found.`);
        }
      });

      if (attemptsLeft > 0 && !inputControls.every((item) => item.input)) {
        console.warn('Some inputs not found yet, retrying...');
        setTimeout(() => attemptInitializeAutocomplete(attemptsLeft - 1), 100); // Retry after a delay
      } else if (attemptsLeft <= 0) {
        console.error('Failed to initialize autocomplete for all inputs.');
      }
    };

    // Start the retry mechanism with up to 10 retries
    attemptInitializeAutocomplete(10);
  }

  southAfricanIdValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const idNumber = control.value;

      // Check if ID number is a 13-digit number
      if (!/^\d{13}$/.test(idNumber)) {
        return { invalidFormat: true };
      }

      // Check date of birth part (first 6 digits represent YYMMDD)
      const year = parseInt(idNumber.slice(0, 2), 10);
      const month = parseInt(idNumber.slice(2, 4), 10);
      const day = parseInt(idNumber.slice(4, 6), 10);
      const fullYear = year >= 0 && year <= 21 ? 2000 + year : 1900 + year;

      const date = new Date(fullYear, month - 1, day);
      if (
        date.getFullYear() !== fullYear ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day
      ) {
        return { invalidDateOfBirth: true };
      }

      // Validate checksum using the Luhn algorithm
      const checkSum = this.calculateLuhnChecksum(idNumber);
      if (checkSum !== 0) {
        return { invalidChecksum: true };
      }

      return null; // Valid ID number
    };
  }

  // Luhn algorithm for checksum validation
  calculateLuhnChecksum(idNumber: string): number {
    let sum = 0;
    let alternate = false;

    for (let i = idNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(idNumber[i], 10);

      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      alternate = !alternate;
    }

    return sum % 10;
  }

  generateFileLink(data: any): void {
    const determineFileType = (fileName: string): string => {
      if (!fileName) return 'application/pdf'; // Default file type
      const lowerCaseFileName = fileName.toLowerCase();
      if (
        lowerCaseFileName.endsWith('.jpg') ||
        lowerCaseFileName.endsWith('.jpeg')
      ) {
        return 'image/jpeg';
      } else if (lowerCaseFileName.endsWith('.png')) {
        return 'image/png';
      } else if (lowerCaseFileName.endsWith('.gif')) {
        return 'image/gif';
      } else if (lowerCaseFileName.endsWith('.pdf')) {
        return 'application/pdf';
      }
      return 'application/octet-stream'; // Generic binary type if unrecognized
    };

    // Generate file URL for `qualification_file`
    if (data.qualification_file?.data && data.qualification_file_name) {
      const qualificationFileType = determineFileType(
        data.qualification_file_name,
      );
      const qualificationBlob = new Blob(
        [new Uint8Array(data.qualification_file.data)],
        { type: qualificationFileType },
      );
      this.qualificationFileUrl = URL.createObjectURL(qualificationBlob);
      console.log(
        'Generated qualification file URL:',
        this.qualificationFileUrl,
      );
    }

    // Generate file URL for `membership_file`
    if (data.membership_file?.data && data.membership_file_name) {
      const membershipFileType = determineFileType(data.membership_file_name);
      const membershipBlob = new Blob(
        [new Uint8Array(data.membership_file.data)],
        { type: membershipFileType },
      );
      this.membershipFileUrl = URL.createObjectURL(membershipBlob);
      console.log('Generated membership file URL:', this.membershipFileUrl);
    }

    // Generate file URL for `id_document_file_name` if applicable
    if (data.id_document_file?.data && data.id_document_file_name) {
      const idDocumentFileType = determineFileType(data.id_document_file_name);
      const idDocumentBlob = new Blob(
        [new Uint8Array(data.id_document_file.data)],
        { type: idDocumentFileType },
      );
      this.idDocumentFileUrl = URL.createObjectURL(idDocumentBlob);
      console.log('Generated ID document file URL:', this.idDocumentFileUrl);
    }

    if (data.curriculum_vitae_file?.data && data.curriculum_vitae_file_name) {
      const curriculumVitaeFileType = determineFileType(
        data.curriculum_vitae_file_name,
      );
      const curriculumVitaeBlob = new Blob(
        [new Uint8Array(data.curriculum_vitae_file.data)],
        { type: curriculumVitaeFileType },
      );
      this.curriculumVitaeFileUrl = URL.createObjectURL(curriculumVitaeBlob);
      console.log(
        'Generated ID document file URL:',
        this.curriculumVitaeFileUrl,
      );
      console.log(this.appEmpHistoryForm);
    }

    if (
      data.tax_clearance_certificate_file?.data &&
      data.tax_clearance_certificate_file_name
    ) {
      const taxClearanceCertificateFileType = determineFileType(
        data.tax_clearance_certificate_file_name,
      );
      const taxClearanceCertificateBlob = new Blob(
        [new Uint8Array(data.tax_clearance_certificate_file.data)],
        {
          type: taxClearanceCertificateFileType,
        },
      );
      this.taxClearanceCertificateFileUrl = URL.createObjectURL(
        taxClearanceCertificateBlob,
      );
      console.log(
        'Generated ID document file URL:',
        this.taxClearanceCertificateFileUrl,
      );
      console.log(this.appEmpHistoryForm);
    }

    if (data.bond_facility_file?.data && data.bond_facility_file_name) {
      const bondFacilityFileType = determineFileType(
        data.bond_facility_file_name,
      );
      const bondFacilityBlob = new Blob(
        [new Uint8Array(data.bond_facility_file.data)],
        {
          type: bondFacilityFileType,
        },
      );
      this.bondFacilityFileUrl = URL.createObjectURL(bondFacilityBlob);
      console.log('Generated ID document file URL:', this.bondFacilityFileUrl);
      console.log(this.appEmpHistoryForm);
    }

    if (
      data.bank_account_proof_file?.data &&
      data.bank_account_proof_file_name
    ) {
      const bankAccountProofFileType = determineFileType(
        data.bank_account_proof_file_name,
      );
      const bankAccountProofBlob = new Blob(
        [new Uint8Array(data.bank_account_proof_file.data)],
        {
          type: bankAccountProofFileType,
        },
      );
      this.bankAccountProofFileUrl = URL.createObjectURL(bankAccountProofBlob);
      console.log(
        'Generated ID document file URL:',
        this.bankAccountProofFileUrl,
      );
      console.log(this.appEmpHistoryForm);
    }

    // Handle case where no files are found
    if (
      !data.qualification_file?.data &&
      !data.membership_file?.data &&
      !(data.id_document_file?.data && data.id_document_file_name)
    ) {
      console.error('No valid files found.');
    }
  }

  onRelationshipChange(value: string): void {
    if (value === 'related') {
      this.showRelationshipDetails = true;
      this.disqualRelationshipForm
        .get('relationshipDetails')
        ?.setValidators([Validators.required]);
    } else {
      this.showRelationshipDetails = false;
      this.disqualRelationshipForm
        .get('relationshipDetails')
        ?.clearValidators();
      this.disqualRelationshipForm.get('relationshipDetails')?.reset(); // Clear the field
    }
    this.disqualRelationshipForm
      .get('relationshipDetails')
      ?.updateValueAndValidity();
  }

  private startCountdown(): void {
    this.countdownSubscription = interval(1000 * 60) // Run every minute
      .subscribe(() => this.updateCountdown());
  }

  private updateCountdown(): void {
    const now = new Date();
    const timeDifference = this.closingDate.getTime() - now.getTime();

    if (timeDifference > 0) {
      const totalHours = timeDifference / (1000 * 60 * 60);
      this.showHours = totalHours < 12;

      if (this.showHours) {
        this.remainingHours = Math.floor(totalHours);
      } else {
        this.daysRemaining = Math.floor(totalHours / 24);
      }
    } else {
      this.remainingHours = 0;
      this.daysRemaining = 0;
      this.showHours = false; // Timer expired
    }
  }

  fetchStatus() {
    this.liquidatorApplicationService
      .getApplicationStatus(this.applicationId)
      .subscribe({
        next: (response) => {
          this.application_status = response;
          this.current_form_status = this.application_status.data.review_status;
          localStorage.setItem('currentFormStatus', this.current_form_status);

          console.log('Application status retrieved:', response);
        },
        error: (err) => {
          console.error('Error retrieving application status:', err);
        },
      });
  }

  checkFormCompletion() {
    const form_status = localStorage.getItem('currentFormStatus');

    // Update this logic based on your form completion criteria
    this.formIsComplete =
      this.taxBondBankForm.valid && form_status === 'Submitted';
  }

  isSection9DetailsValid(): boolean {
    if (!this.section9Details) {
      return false; // section9Details must exist
    }

    // Check required fields
    const requiredFields = [
      'tax_clearance_certificate_file',
      'bank_account_proof_file',
      'bond_facility_file',
    ];

    // Ensure all required fields are defined and truthy
    return requiredFields.every((field) => this.section9Details[field]);
  }

  updateButtonState(): void {
    const buttonElement = document.querySelector(
      'button#submitDeclarationButton',
    ) as HTMLButtonElement;

    if (buttonElement) {
      buttonElement.disabled = this.isSection9DetailsValid();
    }
  }

  loadCurrentApplicationDate() {
    this.adminService.getCurrentApplicationDate().subscribe((response) => {
      const now = new Date();
      if (response.currentApplicationDate != null) {
        this.currentApplicationDate = response.currentApplicationDate;
        this.closingDate = new Date(this.currentApplicationDate.closingDate);

        const timeDifference = this.closingDate.getTime() - now.getTime();

        if (timeDifference > 0) {
          const totalHours = timeDifference / (1000 * 60 * 60);
          this.showHours = totalHours < 12;

          if (this.showHours) {
            this.remainingHours = Math.floor(totalHours);
          } else {
            this.daysRemaining = Math.floor(totalHours / 24);
          }
        } else {
          this.remainingHours = 0;
          this.daysRemaining = 0;
          this.showHours = false; // Timer expired
        }

        this.openingDate = new Date(this.currentApplicationDate.openingDate);
        const timeDif = this.openingDate.getTime() - now.getTime();

        if (timeDif > 0) {
          const totalHours = timeDif / (1000 * 60 * 60);
          this.showOpeningHours = totalHours < 12;

          if (this.showOpeningHours) {
            this.openingRemainingHours = Math.floor(totalHours);
          } else {
            this.openingDaysRemaining = Math.floor(totalHours / 24);
          }
        } else {
          this.openingRemainingHours = 0;
          this.openingDaysRemaining = 0;
          this.showOpeningHours = false; // Timer expired
        }

        this.isBetweenOpeningAndClosing =
          now.getTime() >= this.openingDate.getTime() &&
          now.getTime() <= this.closingDate.getTime();
      } else if (response.currentApplicationDate == null) {
        const currentYear = now.getFullYear();
        this.nextOpeningYear = currentYear + 1;
      }

      // If an opening date is not set, assume next yearly intake
    });
  }

  onScroll() {
    const element = this.modalBody.nativeElement;

    if (element.scrollTop > 1000) {
      this.taxBondBankForm.get('declaration').enable(); // Allow user to manually check the checkbox after reading
    }
  }

  ngOnDestroy(): void {
    this.countdownSubscription?.unsubscribe(); // Clean up the subscription
  }
}
