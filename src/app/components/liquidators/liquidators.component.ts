// liquidators.component.ts
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LiquidatorApplicationService } from 'src/app/services/liquidator-application.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApplicationWindowService } from 'src/app/services/application-window.service';
import { firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

// ===== Types (trimmed to what's needed here) =====
type SectionStatus = 'EMPTY' | 'IN_PROGRESS' | 'SAVED' | 'COMPLETE';
type SectionKey =
  | 'personal'
  | 'business'
  | 'employment_trading'
  | 'infrastructure_offices'
  | 'qualifications_memberships'
  | 'relationship'
  | 'appointments_employment'
  | 'tax_bond_bank';

interface ApplicationWindow {
  _id: string;
  openingDate: string; // ISO
  closingDate: string; // ISO
}

interface FileRef {
  url?: string | null;
  file_name?: string | null;
}

interface LiquidatorApplication {
  _id: string;
  window_id: string;
  status: string;
  editable_until?: string | null;
  sections?: any;
  progress_percent?: number;
  form_complete?: boolean;
}

@Component({
  selector: 'app-liquidators',
  templateUrl: './liquidators.component.html',
  styleUrls: ['./liquidators.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiquidatorsComponent implements OnInit {
  // ===== DI
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);
  private appSvc = inject(LiquidatorApplicationService);
  private winSvc = inject(ApplicationWindowService);
  private cdr = inject(ChangeDetectorRef);

  // ===== UI state (matches your template)
  loading = true;
  currentStep = 1;

  // Show/Hide step groups
  group1Section = true;
  group2Section = false;
  group3Section = false;
  group4Section = false;
  group5Section = false;
  group6Section = false;
  group7Section = false;
  group8Section = false;

  // Validity flags powering the progress rail
  group1SectionValid = false;
  group2SectionValid = false;
  group3SectionValid = false;
  group4SectionValid = false;
  group5SectionValid = false;
  group6SectionValid = false;
  group7SectionValid = false;
  group8SectionValid = false;

  // “Step 9” flag
  formIsComplete = false;

  // ===== Application/window state
  appId!: string;
  windowId!: string;
  openingDate?: Date;
  closingDate?: Date;

  isBetweenOpeningAndClosing = false;

  // Opening/closing banners
  openingDaysRemaining = 0;
  openingRemainingHours = 0;
  showOpeningHours = false;

  daysRemaining = 0;
  remainingHours = 0;
  showHours = false;

  nextOpeningYear?: number;

  // ===== Cities, options, lists (edit to match your enums)
  citiesList = [
    'Johannesburg',
    'Pretoria',
    'Cape Town',
    'Durban',
    'Bloemfontein',
    'Mthatha',
    'Kimberley',
    'Polokwane',
    'Port Elizabeth',
  ];

  qualificationsList = [
    { value: 'LLB', label: 'LLB' },
    { value: 'BCom Accounting', label: 'BCom Accounting' },
    { value: 'CTA', label: 'CTA' },
    { value: 'CA(SA)', label: 'CA(SA)' },
    { value: 'Other', label: 'Other' },
  ];

  professionalMembershipOptions = [
    { value: 'LPC', label: 'Legal Practice Council (LPC)' },
    { value: 'IAC', label: 'Institute of Accounting and Commerce (IAC)' },
    { value: 'SAIPA', label: 'SAIPA' },
    { value: 'CIBA', label: 'CIBA' },
    { value: 'SAICA', label: 'SAICA' },
    { value: 'ACCA', label: 'ACCA' },
    { value: 'NA', label: 'Not applicable' },
  ];

  private readonly stepToSection: Record<number, SectionKey> = {
    1: 'personal',
    2: 'business',
    3: 'employment_trading',
    4: 'infrastructure_offices',
    5: 'qualifications_memberships',
    6: 'relationship',
    7: 'appointments_employment',
    8: 'tax_bond_bank',
  };

  // ===== Forms (exactly what your HTML binds to)
  personalInfoForm = this.fb.group({
    fullName: ['', Validators.required],
    identityNumber: ['', [Validators.required, this.southAfricanIdValidator]],
    identityDocument: [null as File | null, Validators.required],
    race: ['', Validators.required],
    gender: ['', Validators.required],
  });

  businessForm = this.fb.group({
    businessType: ['', Validators.required],
    businessStatus: [''],
  });

  empBusTradingForm = this.fb.group({
    employerName: ['', Validators.required],
    businessTelephone: ['', Validators.required],
    businessAddress: ['', Validators.required],
    firmName: [''],
    partnersOrDirectors: ['', Validators.required],
    businessName: ['', Validators.required],
    businessDetails: ['', Validators.required],
    hasTradingPartners: [false],
    tradingPartners: this.fb.array([]),
  });

  businessDetailsOfficeForm = this.fb.group({
    proofOfRental: ['', Validators.required],
    staffDetails: ['', Validators.required],
    numComputers: [null as number | null, Validators.required],
    numPrinters: [null as number | null, Validators.required],
    additionalInfo: ['', Validators.required],
  });

  businessAdressDetailsForm = this.fb.group({
    provinceOfficeAddress1: ['', Validators.required],
    provinceDetails1: ['', Validators.required],
    provinceOfficeAddress2: ['', Validators.required],
    provinceDetails2: ['', Validators.required],
    provinceOfficeAddress3: ['', Validators.required],
    provinceDetails3: ['', Validators.required],
  });

  qualProMembershipForm = this.fb.group({
    qualifications: ['', Validators.required],
    qualificationFile: [null as File | null], // file
    professionalMemberships: ['', Validators.required],
    professionalMembershipsFile: [null as File | null], // file
  });

  disqualRelationshipForm = this.fb.group({
    disqualification: ['', Validators.required],
    relationshipDisclosure: ['', Validators.required], // not_related | related
    relationshipDetails: [''],
    relationshipCity: [''],
  });

  appEmpHistoryForm = this.fb.group({
    appointmentLocations: new FormControl<string[]>([], { nonNullable: true }),
    employmentHistory: ['', Validators.required],
    CurriculumVitae: [null as File | null], // file
  });

  taxBondBankForm = this.fb.group({
    taxClearance: [null as File | null, Validators.required], // file
    bondFacility: [null as File | null, Validators.required], // file
    bankAccountDocumentation: [null as File | null, Validators.required], // file
    declaration: [false],
  });

  // ===== File Preview URLs used in template
  idDocumentFileUrl?: string;
  qualificationFileUrl?: string;
  membershipFileUrl?: string;
  curriculumVitaeFileUrl?: string;
  taxClearanceCertificateFileUrl?: string;
  bondFacilityFileUrl?: string;
  bankAccountProofFileUrl?: string;

  // ===== Section snapshots used in your template for links/names
  section1Details?: { id_document_file_name?: string; id_document?: FileRef };
  section2Details?: any; // business
  section3Details?: any; // employment_trading
  section4Details?: any; // infrastructure
  section5Details?: any; // addresses
  section6Details?: {
    qualification_file_name?: string;
    membership_file_name?: string;
  };
  section7Details?: any; // relationship
  section8Details?: { curriculum_vitae_file_name?: string };
  section9Details?: {
    tax_clearance_certificate_file_name?: string;
    bond_facility_file_name?: string;
    bank_account_proof_file_name?: string;
  };

  // ===== Other toggles
  hasTradingPartners = false;
  showRelationshipDetails = false;
  membershipConfirmationFileName?: string;
  isEditable: boolean;
  isLocked: boolean;
  editableUntil: any;

  // ====== Lifecycle
  async ngOnInit() {
    this.loading = true;
    try {
      const win = await firstValueFrom(this.winSvc.getActive()); // GET /api/application-windows/active
      if (!win) {
        this.resolveNoWindowPlaceholders(); // sets banners + nextOpeningYear
        return;
      }

      this.windowId = win._id;
      this.openingDate = new Date(win.openingDate);
      this.closingDate = new Date(win.closingDate);
      this.computeWindowBanners();

      const app = await firstValueFrom(this.appSvc.upsertDraft(this.windowId));
      this.appId = app._id;

      await this.refreshSnapshot(); // pulls sections, file URLs, completion flags
    } catch (e: any) {
      console.log(e)
      this.toast.error(e?.error?.message || 'Failed to load application');
    } finally {
      this.loading = false;
      this.cdr.markForCheck(); // OnPush refresh
    }
  }

  // ======= Convenience getters used by the template
  get f() {
    return this.personalInfoForm.controls as any;
  }
  get g() {
    return this.businessForm.controls as any;
  }
  get tradingPartners(): FormArray<FormGroup> {
    return this.empBusTradingForm.get(
      'tradingPartners',
    ) as FormArray<FormGroup>;
  }

  // ======= Window helpers
  private computeWindowBanners() {
    const now = new Date();
    const open = this.openingDate!;
    const close = this.closingDate!;

    if (now < open) {
      // pre-opening
      const diffMs = +open - +now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      this.openingDaysRemaining = diffDays;
      this.openingRemainingHours = diffHours;
      this.showOpeningHours = diffDays === 0;
      this.isBetweenOpeningAndClosing = false;
      this.nextOpeningYear = open.getFullYear();
      return;
    }

    if (now >= open && now <= close) {
      // open
      this.isBetweenOpeningAndClosing = true;
      const msToClose = +close - +now;
      const hoursToClose = Math.floor(msToClose / (1000 * 60 * 60));
      const daysToClose = Math.floor(hoursToClose / 24);
      this.daysRemaining = daysToClose;
      this.remainingHours = hoursToClose;
      this.showHours = daysToClose === 0;
      this.nextOpeningYear = undefined;
      return;
    }

    // closed
    this.isBetweenOpeningAndClosing = false;
    // Next year indicator (simple heuristic)
    this.nextOpeningYear = new Date(now.getFullYear() + 1, 0, 1).getFullYear();
  }

  private resolveNoWindowPlaceholders() {
    const now = new Date();
    this.isBetweenOpeningAndClosing = false;
    this.openingDaysRemaining = 0;
    this.openingRemainingHours = 0;
    this.showOpeningHours = false;
    this.daysRemaining = 0;
    this.remainingHours = 0;
    this.showHours = false;
    this.nextOpeningYear =
      now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear(); // simple UX
  }

  // ======= Navigation (progress rail / step toggles)
  private setStep(step: number) {
    this.currentStep = step;
    this.group1Section = step === 1;
    this.group2Section = step === 2;
    this.group3Section = step === 3;
    this.group4Section = step === 4;
    this.group5Section = step === 5;
    this.group6Section = step === 6;
    this.group7Section = step === 7;
    this.group8Section = step === 8;
  }

  moveGroupOneSection() {
    this.setStep(1);
  }
  moveGroupTwoSection() {
    this.setStep(2);
  }
  onGroupThreeStepClick() {
    this.setStep(3);
  }
  onGroupFourStepClick() {
    this.setStep(4);
  }
  moveGroupFiveSection() {
    this.setStep(5);
  }
  moveGroupSixSection() {
    this.setStep(6);
  }
  moveGroupSevenSection() {
    this.setStep(7);
  }
  moveGroupEightSection() {
    this.setStep(8);
  }
  movebackGroupTwoSection() {
    this.setStep(2);
  }
  movebackGroupThreeSection() {
    this.setStep(3);
  }
  movebackGroupFourSection() {
    this.setStep(4);
  }
  movebackGroupFiveSection() {
    this.setStep(5);
  }
  movebackGroupSixSection() {
    this.setStep(6);
  }
  movebackGroupEightSection() {
    this.setStep(7);
  }
  moveGroupNineSection() {
    // purely UI toggle — you could scroll to submission section if needed
    this.setStep(8);
  }

  // ======= File handlers (HTML -> FormControl + preview URL)
  onFileSelected(evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0] || null;
    this.personalInfoForm.patchValue({ identityDocument: file });
    this.idDocumentFileUrl = file ? URL.createObjectURL(file) : undefined;
  }

  onNewFileChange(
    evt: Event,
    which: 'qualificationFile' | 'membershipConfirmationFile',
  ) {
    const file = (evt.target as HTMLInputElement).files?.[0] || null;
    if (which === 'qualificationFile') {
      this.qualProMembershipForm.patchValue({ qualificationFile: file });
      this.qualificationFileUrl = file ? URL.createObjectURL(file) : undefined;
    } else {
      this.qualProMembershipForm.patchValue({
        professionalMembershipsFile: file,
      });
      this.membershipFileUrl = file ? URL.createObjectURL(file) : undefined;
      this.membershipConfirmationFileName = file?.name;
    }
  }

  onFileSelectedCV(evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0] || null;
    this.appEmpHistoryForm.patchValue({ CurriculumVitae: file });
    this.curriculumVitaeFileUrl = file ? URL.createObjectURL(file) : undefined;
  }

  onFileSelectedTaxClearance(
    evt: Event,
    which: 'taxClearance' | 'bondFacility' | 'bankAccountDocumentation',
  ) {
    const file = (evt.target as HTMLInputElement).files?.[0] || null;
    this.taxBondBankForm.patchValue({ [which]: file });
    if (which === 'taxClearance') {
      this.taxClearanceCertificateFileUrl = file
        ? URL.createObjectURL(file)
        : undefined;
    }
    if (which === 'bondFacility') {
      this.bondFacilityFileUrl = file ? URL.createObjectURL(file) : undefined;
    }
    if (which === 'bankAccountDocumentation') {
      this.bankAccountProofFileUrl = file
        ? URL.createObjectURL(file)
        : undefined;
    }
  }

  // ======= Trading partners
  toggleTradingPartners(evt: Event) {
    const checked = (evt.target as HTMLInputElement).checked;
    this.hasTradingPartners = checked;
    this.empBusTradingForm.patchValue({ hasTradingPartners: checked });

    if (checked && this.tradingPartners.length === 0) {
      this.addTradingPartner();
    }
    if (!checked) {
      while (this.tradingPartners.length) this.tradingPartners.removeAt(0);
    }
  }

  addTradingPartner() {
    const grp = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
    });
    this.tradingPartners.push(grp);
  }

  removeTradingPartner(i: number) {
    this.tradingPartners.removeAt(i);
    if (this.tradingPartners.length === 0) {
      this.empBusTradingForm.patchValue({ hasTradingPartners: false });
      this.hasTradingPartners = false;
    }
  }

  // ======= Relationship disclosure toggle
  onRelationshipChange(value: 'not_related' | 'related') {
    const detailsCtrl = this.disqualRelationshipForm.get('relationshipDetails');
    const cityCtrl = this.disqualRelationshipForm.get('relationshipCity');

    this.showRelationshipDetails = value === 'related';

    if (this.showRelationshipDetails) {
      detailsCtrl?.setValidators([Validators.required]);
      cityCtrl?.setValidators([Validators.required]);
      detailsCtrl?.enable({ emitEvent: false });
      cityCtrl?.enable({ emitEvent: false });
    } else {
      // Clear validators + value + errors; disable so they won't submit
      detailsCtrl?.clearValidators();
      cityCtrl?.clearValidators();

      detailsCtrl?.reset('', { emitEvent: false });
      cityCtrl?.reset('', { emitEvent: false });

      detailsCtrl?.disable({ emitEvent: false });
      cityCtrl?.disable({ emitEvent: false });
    }

    detailsCtrl?.updateValueAndValidity({ emitEvent: false });
    cityCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  // ======= Appointment locations (checkbox list)
  onCheckboxChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const val = input.value;
    const selected = [...this.appEmpHistoryForm.value.appointmentLocations!];
    if (input.checked && !selected.includes(val)) {
      selected.push(val);
    }
    if (!input.checked && selected.includes(val)) {
      const idx = selected.indexOf(val);
      selected.splice(idx, 1);
    }
    this.appEmpHistoryForm.patchValue({ appointmentLocations: selected });
  }

  // ======= Submissions per section (maps EXACTLY to backend whitelist/keys)

  // Step 1 — personal
  async PersonalInformationSubmit() {
    if (this.personalInfoForm.invalid) {
      this.personalInfoForm.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    // payload keys (backend whitelist: full_name, identity_number, race, gender, id_document, status)
    fd.append('full_name', this.personalInfoForm.value.fullName!);
    fd.append('identity_number', this.personalInfoForm.value.identityNumber!);
    fd.append('race', this.personalInfoForm.value.race!);
    fd.append('gender', this.personalInfoForm.value.gender!);
    if (this.personalInfoForm.value.identityDocument) {
      fd.append(
        'id_document',
        this.personalInfoForm.value.identityDocument as File,
      );
    }
    fd.append('status', 'SAVED');
    await this.sendSection('personal', fd, 1);
  }
  async editSection() {
    return this.PersonalInformationSubmit();
  }

  // Step 2 — verification consent + business
  async businessInfoSubmit() {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    // The consent text is static in UI; set backend boolean as true since the section exists & acknowledged.
    fd.append('consent_verify', 'true');
    fd.append('business_type', this.businessForm.value.businessType!);
    fd.append('business_status', this.businessForm.value.businessStatus || '');
    fd.append('status', 'SAVED');
    await this.sendSection('business', fd, 2);
  }
  async editSection2() {
    return this.businessInfoSubmit();
  }

  // Step 3 — employment + business trading
  async empBusTradingSubmit() {
    if (this.empBusTradingForm.invalid) {
      this.empBusTradingForm.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    fd.append('employer_name', this.empBusTradingForm.value.employerName!);
    fd.append(
      'business_telephone',
      this.empBusTradingForm.value.businessTelephone!,
    );
    fd.append(
      'business_address',
      this.empBusTradingForm.value.businessAddress!,
    );
    fd.append('firm_name', this.empBusTradingForm.value.firmName || '');
    fd.append(
      'partners_or_directors',
      this.empBusTradingForm.value.partnersOrDirectors!,
    );
    fd.append('business_name', this.empBusTradingForm.value.businessName!);
    fd.append(
      'business_details',
      this.empBusTradingForm.value.businessDetails!,
    );
    fd.append(
      'has_trading_partners',
      String(!!this.empBusTradingForm.value.hasTradingPartners),
    );

    const partners = (this.empBusTradingForm.value.tradingPartners ||
      []) as any[];
    fd.append(
      'trading_partners',
      JSON.stringify(
        partners.map((p) => ({ name: p.name, address: p.address })),
      ),
    );

    fd.append('status', 'SAVED');
    await this.sendSection('employment_trading', fd, 3);
  }
  async editSection3() {
    return this.empBusTradingSubmit();
  }

  // Step 4 — business infrastructure + other province offices
  async businessDetailsOfficeSubmit() {
    // Both forms are shown in Step 4; validate both
    const invalidA = this.businessDetailsOfficeForm.invalid;
    const invalidB = this.businessAdressDetailsForm.invalid;
    if (invalidA) this.businessDetailsOfficeForm.markAllAsTouched();
    if (invalidB) this.businessAdressDetailsForm.markAllAsTouched();
    if (invalidA || invalidB) return;

    // First: infrastructure_offices
    const infraFd = new FormData();
    infraFd.append(
      'proof_of_rental',
      this.businessDetailsOfficeForm.value.proofOfRental!,
    );
    infraFd.append(
      'staff_details',
      this.businessDetailsOfficeForm.value.staffDetails!,
    );
    infraFd.append(
      'num_computers',
      String(this.businessDetailsOfficeForm.value.numComputers!),
    );
    infraFd.append(
      'num_printers_scanners_faxes',
      String(this.businessDetailsOfficeForm.value.numPrinters!),
    );
    infraFd.append(
      'additional_info',
      this.businessDetailsOfficeForm.value.additionalInfo!,
    );

    // Build "other_province_offices" array payload from the second form
    const offices = [
      {
        address: this.businessAdressDetailsForm.value.provinceOfficeAddress1,
        details: this.businessAdressDetailsForm.value.provinceDetails1,
      },
      {
        address: this.businessAdressDetailsForm.value.provinceOfficeAddress2,
        details: this.businessAdressDetailsForm.value.provinceDetails2,
      },
      {
        address: this.businessAdressDetailsForm.value.provinceOfficeAddress3,
        details: this.businessAdressDetailsForm.value.provinceDetails3,
      },
    ];
    infraFd.append('other_province_offices', JSON.stringify(offices));
    infraFd.append('status', 'SAVED');

    await this.sendSection('infrastructure_offices', infraFd, 4);
  }
  async editSection4() {
    return this.businessDetailsOfficeSubmit();
  }

  // Step 5 — qualifications + professional memberships
  async qualProMembershipSubmit() {
    if (this.qualProMembershipForm.invalid) {
      this.qualProMembershipForm.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    fd.append(
      'qualification_choice',
      this.qualProMembershipForm.value.qualifications!,
    );

    const qualFile = this.qualProMembershipForm.value.qualificationFile;
    if (qualFile) fd.append('qualification_file', qualFile as File);

    fd.append(
      'professional_membership_choice',
      this.qualProMembershipForm.value.professionalMemberships!,
    );

    const pmFile = this.qualProMembershipForm.value.professionalMembershipsFile;
    if (pmFile) fd.append('membership_confirmation_file', pmFile as File);

    // (Optional) If you support a structured “memberships” array:
    // fd.append('memberships', JSON.stringify([...]));

    fd.append('status', 'SAVED');
    await this.sendSection('qualifications_memberships', fd, 5);
  }
  async editSection5() {
    return this.qualProMembershipSubmit();
  }

  // Step 6 — disqualification + relationship
  async disqualRelationshipSubmit() {
    if (this.disqualRelationshipForm.invalid) {
      this.disqualRelationshipForm.markAllAsTouched();
      return;
    }
    const v = this.disqualRelationshipForm.value;
    const fd = new FormData();
    fd.append('disqualification_note', v.disqualification!);
    fd.append('relationship_disclosure', v.relationshipDisclosure!);
    fd.append('relationship_details', v.relationshipDetails || '');
    fd.append('relationship_city', v.relationshipCity || '');
    fd.append('status', 'SAVED');
    await this.sendSection('relationship', fd, 6);
  }
  async editSection6() {
   // return this.disqualRelationshipSubmit();
  }

  // Step 7 — appointments & employment history (+ CV)
  async appEmpHistorySubmit() {
    if (this.appEmpHistoryForm.invalid) {
      this.appEmpHistoryForm.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    const locations = this.appEmpHistoryForm.value.appointmentLocations || [];
    fd.append('appointment_locations', JSON.stringify(locations));
    fd.append(
      'employment_history',
      this.appEmpHistoryForm.value.employmentHistory!,
    );

    const cv = this.appEmpHistoryForm.value.CurriculumVitae;
    if (cv) fd.append('curriculum_vitae', cv as File);

    fd.append('status', 'SAVED');
    await this.sendSection('appointments_employment', fd, 7);
  }
  async editSection7() {
    return this.appEmpHistorySubmit();
  }

  // Step 8 — tax, bond, bank, declaration
  async taxBondBankSubmit() {
    if (this.taxBondBankForm.invalid) {
      this.taxBondBankForm.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    const v = this.taxBondBankForm.value;

    if (v.taxClearance) fd.append('tax_clearance', v.taxClearance as File);
    if (v.bondFacility) fd.append('bond_facility', v.bondFacility as File);
    if (v.bankAccountDocumentation)
      fd.append(
        'bank_account_documentation',
        v.bankAccountDocumentation as File,
      );
 fd.append('declaration_agreed', v.declaration ? 'true' : 'false');
    // do not flip declaration here; the final button does it
    fd.append('status', 'SAVED');

    await this.sendSection('tax_bond_bank', fd, 8);
  }
  async editSection8() {
    return this.taxBondBankSubmit();
  }

  // Final button in your UI: only toggles declaration on section “tax_bond_bank”
  async updateDeclarationStatus() {
    // Require the checkbox to be checked
    if (!this.taxBondBankForm.value.declaration) {
      this.taxBondBankForm.get('declaration')?.markAsTouched();
      this.toast.warning('Please accept the declaration first.');
      return;
    }
    const fd = new FormData();
    fd.append('declaration_agreed', 'true');
    fd.append('status', 'COMPLETE'); // you can mark COMPLETE here if policy allows

    await this.sendSection('tax_bond_bank', fd, 8);

    // After declaration, check completion across all groups
    await this.refreshSnapshot(); // updates formIsComplete from server value
    if (this.formIsComplete) {
      this.toast.success('Declaration submitted. Your form is complete.');
    } else {
      this.toast.info(
        'Declaration submitted. Some sections are not COMPLETE yet.',
      );
    }
  }

  // (Optional) Full application submit (if you expose a button later)
  async submitApplication() {
    try {
      await this.appSvc.submit(this.appId).toPromise();
      this.updateDeclarationStatus()
      this.toast.success('Application submitted.');
      await this.refreshSnapshot();
    } catch (e: any) {
      this.toast.error(e?.error?.message || 'Submit failed');
    }
  }

  // ======= Core send helper
  private async sendSection(
    section: SectionKey,
    fd: FormData,
    stepForValidFlag: number,
  ) {
    try {
      await this.appSvc.updateSection(this.appId, section, fd).toPromise();
      this.toast.success('Saved');

      // Refresh snapshot to pull file URLs, names, statuses, progress, completion
      await this.refreshSnapshot();

      // Flip the progress flag for the rail when section is SAVED/COMPLETE
      const ok = this.isSectionSavedOrComplete(section);
      this.setSectionValidFlag(stepForValidFlag, ok);

      // Auto-advance to next step if desired
      if (ok) this.setStep(Math.min(stepForValidFlag + 1, 8));
    } catch (e: any) {
      this.toast.error(e?.error?.message || 'Save failed');
    }
  }

  private setSectionValidFlag(step: number, value: boolean) {
    switch (step) {
      case 1:
        this.group1SectionValid = value;
        break;
      case 2:
        this.group2SectionValid = value;
        break;
      case 3:
        this.group3SectionValid = value;
        break;
      case 4:
        this.group4SectionValid = value;
        break;
      case 5:
        this.group5SectionValid = value;
        break;
      case 6:
        this.group6SectionValid = value;
        break;
      case 7:
        this.group7SectionValid = value;
        break;
      case 8:
        this.group8SectionValid = value;
        break;
    }
  }

  private isSectionSavedOrComplete(section: SectionKey): boolean {
    const s = this.snapshot?.sections?.[section]?.status as
      | SectionStatus
      | undefined;
    return s === 'SAVED' || s === 'COMPLETE';
  }

  // ======= Snapshot from server to refresh file links, statuses, etc.

  private snapshot?: LiquidatorApplication;

private goToNextStepIfCurrentSaved(): void {
  // Walk forward from currentStep until we hit the first incomplete section
  let step = this.currentStep;

  while (step <= 8) {
    const key = this.stepToSection[step];
    if (!key) break;

    if (this.isSectionSavedOrComplete(key)) {
      step++; // keep going
    } else {
      break;  // stop at first incomplete
    }
  }

  // If all were complete, you'll land on 9 → clamp to last step (8)
  this.setStep(Math.min(step, 8));
}


  private async refreshSnapshot() {
    const snap = await this.appSvc.getById(this.appId).toPromise();
    this.snapshot = snap;
    // Map section-file previews & names for your template
    const sec = snap.sections || {};
    // --- Step 1
    const personal = sec.personal || {};
    this.section1Details = {
      id_document_file_name: personal?.id_document?.file_name || '',
      id_document: personal?.id_document || '',
    };
    this.idDocumentFileUrl = personal?.id_document?.url || undefined;

    console.log(personal);

    this.personalInfoForm.patchValue(
      {
        fullName: personal.full_name ?? '',
        identityNumber: personal?.identity_number ?? '',
        race: personal?.race ?? '',
        gender: personal?.gender ?? '',
        // identityDocument: keep whatever the user selected (File), server returns metadata only
      },
      { emitEvent: false },
    );

    // --- Step 2
    this.section2Details = sec.business || {};

    this.businessForm.patchValue({
      businessType: this.section2Details.business_type || '',
      businessStatus: this.section2Details.business_status || '',
    });

    // --- Step 3
    this.section3Details = sec.employment_trading || {};

    this.hasTradingPartners = this.section3Details.has_trading_partners || {};
    this.empBusTradingForm.patchValue({
      employerName: this.section3Details.employer_name || '',
      businessTelephone: this.section3Details.business_telephone || '',
      businessAddress: this.section3Details.business_address || '',
      firmName: this.section3Details.firm_name || '',
      partnersOrDirectors: this.section3Details.partners_or_directors || '',
      businessName: this.section3Details.business_name || '',
      businessDetails: this.section3Details.business_details || '',
    });

    // 🔑 simple fix: rebuild FormArray instead of patchValue
    if (
      Array.isArray(this.section3Details.trading_partners) &&
      this.section3Details.trading_partners.length > 0
    ) {
      this.hasTradingPartners = true;

      const fa = this.tradingPartners;
      fa.clear(); // remove any existing

      this.section3Details.trading_partners.forEach((p) => {
        fa.push(
          this.fb.group({
            name: [p.name || ''],
            address: [p.address || ''],
          }),
        );
      });

      this.empBusTradingForm.patchValue({ hasTradingPartners: true });
    }

    // --- Step 4

    this.section4Details = sec.infrastructure_offices || {};

    this.businessDetailsOfficeForm.patchValue({
      proofOfRental: this.section4Details.proof_of_rental_text || '',
      staffDetails: this.section4Details.staff_details || '',
      numComputers: this.section4Details.num_computers || '',
      numPrinters: this.section4Details.num_printers_scanners_faxes || '',
      additionalInfo: this.section4Details.additional_info || '',
    });

    const baddress = this.section4Details.other_province_offices || {}

    this.businessAdressDetailsForm.patchValue({
      provinceOfficeAddress1:
        baddress.province_office_address1 ||
        '',
      provinceDetails1:
        baddress.province_details1 || '',
      provinceOfficeAddress2:
        baddress.province_office_address2 ||
        '',
      provinceDetails2:
        baddress.province_details2 || '',
      provinceOfficeAddress3:
        baddress.province_office_address3 ||
        '',
      provinceDetails3:
        baddress.province_details3 || '',
    });

    this.section5Details = sec.infrastructure_offices;

    // --- Step 5
    const qm = sec.qualifications_memberships || {};

    console.log(qm);
    this.section6Details = {
      qualification_file_name: qm?.qualification_file?.file_name,
      membership_file_name: qm?.membership_confirmation_file?.file_name,
    };
    this.qualificationFileUrl = qm?.qualification_file?.url || undefined;
    this.membershipFileUrl = qm?.membership_confirmation_file?.url || undefined;

    this.qualProMembershipForm.patchValue({
      qualifications: qm.qualification_choice || '',

      professionalMemberships: qm.professional_membership_choice || '',
    });

    // --- Step 6
    this.section7Details = sec.relationship;
    console.log(this.section7Details);
    this.disqualRelationshipForm.patchValue({
      disqualification: this.section7Details.disqualification_note,
      relationshipDetails: this.section7Details.relationship_details,
      relationshipCity: this.section7Details.relationship_city,
    });

    this.disqualRelationshipForm
      .get('relationshipDisclosure')!
      .valueChanges.subscribe((v: 'related' | 'not_related') =>
        this.onRelationshipChange(v),
      );

    // After you load "sec", call this:
    this.prefillFromSnapshot(sec);

    this.onRelationshipChange(this.section7Details.relationship_disclosure);
    // --- Step 7
    const ae = sec.appointments_employment || {};
    this.section8Details = {
      curriculum_vitae_file_name: ae?.curriculum_vitae?.file_name,
    };
    this.curriculumVitaeFileUrl = ae?.curriculum_vitae?.url || undefined;
    console.log(ae);
    this.appEmpHistoryForm.patchValue({
      appointmentLocations: ae.appointment_locations,
      employmentHistory: ae.employment_history,
    });

    // --- Step 8
    const tbb = sec.tax_bond_bank || {};
    this.section9Details = {
      tax_clearance_certificate_file_name: tbb?.tax_clearance?.file_name,
      bond_facility_file_name: tbb?.bond_facility?.file_name,
      bank_account_proof_file_name: tbb?.bank_account_documentation?.file_name,
    };
    this.taxClearanceCertificateFileUrl = tbb?.tax_clearance?.url || undefined;
    this.bondFacilityFileUrl = tbb?.bond_facility?.url || undefined;
    this.bankAccountProofFileUrl =
      tbb?.bank_account_documentation?.url || undefined;

      console.log(tbb)

        this.taxBondBankForm.patchValue({
          declaration:tbb.declaration_agreed ,
        }) 


    // Progress flags
    this.group1SectionValid = this.isSectionSavedOrComplete('personal');
    this.group2SectionValid = this.isSectionSavedOrComplete('business');
    this.group3SectionValid =
      this.isSectionSavedOrComplete('employment_trading');
    this.group4SectionValid = this.isSectionSavedOrComplete(
      'infrastructure_offices',
    );
    this.group5SectionValid = this.isSectionSavedOrComplete(
      'qualifications_memberships',
    );
    this.group6SectionValid = this.isSectionSavedOrComplete('relationship');
    this.group7SectionValid = this.isSectionSavedOrComplete(
      'appointments_employment',
    );
    this.group8SectionValid = this.isSectionSavedOrComplete('tax_bond_bank');


const requiredSections: Array<keyof typeof sec> = [
  'personal',
  'business',
  'employment_trading',
  'infrastructure_offices',
  'qualifications_memberships',
  'relationship',
  'appointments_employment',
  'tax_bond_bank',
];

 const allSectionsOk = requiredSections.every((s:any) =>
  this.isSectionSavedOrComplete(s)
);

// Declaration must be true
const declarationOk = !!sec?.tax_bond_bank?.declaration_agreed;

// Status must be SUBMITTED
const submittedOk = snap?.status === 'SUBMITTED';
console.log(allSectionsOk && declarationOk && submittedOk)
// Final condition
this.formIsComplete = allSectionsOk && declarationOk && submittedOk;

// --- Submitted-but-editable / locked flags for alerts
this.editableUntil =
  snap?.editable_until ? new Date(snap.editable_until) : null;
const now = new Date();

// true when submitted, not locked, and still before editable_until
this.isEditable =
  !!this.formIsComplete &&
  !snap?.is_locked &&
  !!this.editableUntil &&
  this.editableUntil.getTime() > now.getTime();

// true when submitted but no longer editable (either locked or expired)
this.isLocked =
  !!this.formIsComplete &&
  (!!snap?.is_locked ||
    !this.editableUntil ||
    this.editableUntil.getTime() <= now.getTime());





    this.goToNextStepIfCurrentSaved();
    // Keep step in range
    if (this.currentStep < 1 || this.currentStep > 8) this.currentStep = 1;
    this.cdr.markForCheck();
  }

  

  prefillFromSnapshot(sec: any) {
    // You had: this.section7Details = sec.relationship;
    const s = sec?.relationship ?? null;
    this.section7Details = s;
    console.log('section7Details', s);

    // Decide what to tick on the radio:
    const disclosure: 'related' | 'not_related' =
      s?.relationship_disclosure === 'related' ||
      s?.relationship_disclosure === 'not_related'
        ? s.relationship_disclosure
        : s?.relationship_details
          ? 'related'
          : 'not_related';

    // Patch ALL matching form controls (including the radio)
    this.disqualRelationshipForm.patchValue({
      relationshipDisclosure: disclosure, // <<<< important
      relationshipDetails: s?.relationship_details ?? '',
      relationshipCity: s?.relationship_city ?? '',
      disqualification: s?.disqualification_note ?? '',
    });

    // Align validators/UI immediately (optional if you rely on valueChanges above)
    this.onRelationshipChange(disclosure);
  }

  ngOnDestroy() {
    [
      this.idDocumentFileUrl,
      this.qualificationFileUrl,
      this.membershipFileUrl,
      this.curriculumVitaeFileUrl,
      this.taxClearanceCertificateFileUrl,
      this.bondFacilityFileUrl,
      this.bankAccountProofFileUrl,
    ]
      .filter(Boolean)
      .forEach((u) => URL.revokeObjectURL(u as string));
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

  // ===== Modal scroll hook (optional, used by template)
  onScroll() {
    // No-op, but kept because your HTML calls it. Add tracking if needed.
  }

  /** Rebuild a FormArray of {name,address} from plain array */
  private setTradingPartners(rows: Array<{ name?: string; address?: string }>) {
    const fa = this.tradingPartners;
    while (fa.length) fa.removeAt(0);
    (rows || []).forEach((r) => {
      fa.push(
        this.fb.group({
          name: [r?.name || '', Validators.required],
          address: [r?.address || '', Validators.required],
        }),
      );
    });
    const has = (rows || []).length > 0;
    this.hasTradingPartners = has;
    this.empBusTradingForm.patchValue(
      { hasTradingPartners: has },
      { emitEvent: false },
    );
  }
}
