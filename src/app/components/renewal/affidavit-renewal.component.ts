import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { forkJoin, of, switchMap, tap } from 'rxjs';
import {
  RenewalService,
  RenewalSnapshot,
  RenewalOfficeRow,
} from '../../services/renewal.service'; // <-- adjust path if needed

declare const bootstrap: any; // Bootstrap’s JS

type OfficeRow = {
  city: string;
  takingAppointments: boolean;
  physicalAddress: string;
  postalAddress: string;
  telephone: string;
};

@Component({
  selector: 'app-affidavit-renewal',
  templateUrl: './affidavit-renewal.component.html',
  styleUrls: ['./affidavit-renewal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffidavitRenewalComponent implements OnInit {
  // Gate (if you need to block outside opening window, keep this true for now)
  isBetweenOpeningAndClosing = true;

  // From API
  private renewalId: number | null = null;

  // Cities as in PDF
  readonly cities = [
    'Pretoria',
    'Johannesburg',
    'Mahikeng',
    'Cape Town',
    'Grahamstown',
    'Port Elizabeth',
    'Bloemfontein',
    'Kimberley',
    'Durban',
    'Pietermaritzburg',
    'Thohoyandou',
    'Bhisho',
    'Mthatha',
    'Nelspruit',
    'Polokwane',
  ];

  // Top-level form
  form!: FormGroup;

  // UI state
  loading = false;
  saving = false;

  // Signals
  s1_updatedInfoSelected = signal(false);
  s5_changedSelected = signal(false);
  relationshipIsRelated = signal(false);

  // File preview state (URLs or truthy markers when server already has files)
  taxClearancePersonalUrl: string | null = null;
  taxClearanceBusinessUrl: string | null = null;
  bondFacilityUrl: string | null = null;
  affidavitFileUrl: string | null = null;

  // Lists
  insurersLettersNames: string[] = [];
  membershipCertsNames: string[] = [];

  // Static PDF link (client asset or route)
  disqualificationsPdfUrl = '/assets/pdfs/Annexure-Disqualifications.pdf';

  constructor(
    private fb: FormBuilder,
    private renewalSvc: RenewalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupReactions();

    // Load or create current renewal, then hydrate form
    this.loading = true;
    this.renewalSvc
      .start()
      .pipe(
        tap((snap) => this.hydrateFromSnapshot(snap)),
        tap(() => (this.loading = false))
      )
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
          alert('Could not start renewal. Please try again.');
        },
      });
  }

  // -------- FORM BUILDERS / REACTIONS --------

  private buildForm() {
    this.form = this.fb.group({
      section1: this.fb.group({
        fullName: ['', [Validators.required, Validators.maxLength(200)]],
        identityNumber: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
        tickNationalList: this.fb.control<'confirm' | 'update' | ''>('', Validators.required),
        updatedInfo: [''],
      }),

      section5: this.fb.group({
        businessDetailsChange: this.fb.control<'unchanged' | 'changed' | ''>('', Validators.required),
        businessChangeDetails: [''],
        mainBusinessPhysical: ['', Validators.required],
      }),

      offices: this.fb.array(this.cities.map((city) => this.buildOfficeRow(city))),

      insurersLetters: this.fb.array([]),

      memberships: this.fb.array([]),

      disqualificationNote: [''],

      currentYearActivities: [''],
      willInformIfUnavailable: [false],

      relationship: this.fb.group({
        relation: this.fb.control<'not_related' | 'related' | ''>('', Validators.required),
        relationDetails: [''],
      }),

      taxClearancePersonal: [null, Validators.required],
      taxClearanceBusiness: [null, Validators.required],

      ackChangeNotice: [false, Validators.requiredTrue],
      ackPunitiveNotice: [false, Validators.requiredTrue],

      enclosures: this.fb.group({
        annexA_personal: [false, Validators.requiredTrue],
        annexB_business: [false, Validators.requiredTrue],
        annexC_bond: [false, Validators.requiredTrue],
      }),

      bondFacility: [null, Validators.required],

      bankAccountProof: [null],

      affidavitFile: [null, Validators.required],

      declaration: [false, Validators.requiredTrue],
    });
  }

  private setupReactions() {
    this.form.get('section1.tickNationalList')?.valueChanges.subscribe((v) => {
      this.s1_updatedInfoSelected.set(v === 'update');
      const ctrl = this.form.get('section1.updatedInfo')!;
      v === 'update'
        ? ctrl.addValidators([Validators.required, Validators.minLength(5)])
        : ctrl.clearValidators();
      ctrl.updateValueAndValidity();
    });

    this.form.get('section5.businessDetailsChange')?.valueChanges.subscribe((v) => {
      this.s5_changedSelected.set(v === 'changed');
      const ctrl = this.form.get('section5.businessChangeDetails')!;
      v === 'changed'
        ? ctrl.addValidators([Validators.required, Validators.minLength(5)])
        : ctrl.clearValidators();
      ctrl.updateValueAndValidity();
    });

    this.form.get('relationship.relation')?.valueChanges.subscribe((v) => {
      this.relationshipIsRelated.set(v === 'related');
      const ctrl = this.form.get('relationship.relationDetails')!;
      v === 'related'
        ? ctrl.addValidators([Validators.required, Validators.minLength(5)])
        : ctrl.clearValidators();
      ctrl.updateValueAndValidity();
    });
  }

private buildOfficeRow(city: string): FormGroup {
  return this.fb.group({
    city: [city],
    takingAppointments: [false],
    physicalAddress: [''],
    postalAddress: [''],
    telephone: [''],
  });
}


  // -------- SNAPSHOT HYDRATION --------

  private hydrateFromSnapshot(snap: RenewalSnapshot) {
    this.renewalId = snap.renewal?.renewal_id ?? null;

    // Section 1
    if (snap.personal) {
      this.form.get('section1.fullName')?.setValue(snap.personal.full_name || '');
      this.form.get('section1.identityNumber')?.setValue(snap.personal.identity_number || '');
    }

    // Section 5
    if (snap.business) {
      this.form.get('section5.businessDetailsChange')?.setValue(snap.business.business_details_change || '');
      this.form.get('section5.businessChangeDetails')?.setValue(snap.business.business_change_details || '');
      this.form.get('section5.mainBusinessPhysical')?.setValue(snap.business.main_business_physical || '');
    }

    // Offices
    if (Array.isArray(snap.offices) && snap.offices.length) {
      const officesFA = this.officesFA;
      // patch by city
      snap.offices.forEach((o: RenewalOfficeRow) => {
        const idx = this.cities.findIndex((c) => c === o.city);
        if (idx >= 0) {
          const g = officesFA.at(idx) as FormGroup;
          g.patchValue({
            takingAppointments: !!o.taking_appointments,
            physicalAddress: o.physical_address || '',
            postalAddress: o.postal_address || '',
            telephone: o.telephone || '',
          });
        }
      });
    }

    // Insurer letters (server -> readonly rows)
    if (snap.insurerLetters?.length) {
      snap.insurerLetters.forEach((r) => {
        this.insurersLettersFA.push(
          this.fb.group({
            serverId: [r.id],
            file: [null],
            fileName: [r.file_name],
          })
        );
      });
      this.insurersLettersNames = this.insurersLettersFA.controls.map((c) => c.get('fileName')?.value || '');
    }

    // Memberships (server -> readonly rows)
    if (snap.memberships?.length) {
      snap.memberships.forEach((m) => {
        this.membershipsFA.push(
          this.fb.group({
            serverId: [m.id],
            organisation: [m.organisation, Validators.required],
            inGoodStanding: [!!m.in_good_standing],
            certificate: [null],
            certificateName: [m.certificate_name || ''],
          })
        );
      });
      this.membershipCertsNames = this.membershipsFA.controls.map((c) => c.get('certificateName')?.value || '');
    }

    // Documents (for UI “Attached” signals in modal)
    if (snap.documents) {
      if (snap.documents.has_tax_personal) this.taxClearancePersonalUrl = '#'; // truthy marker
      if (snap.documents.has_tax_business) this.taxClearanceBusinessUrl = '#';
      if (snap.documents.has_bond) this.bondFacilityUrl = '#';
      if (snap.documents.has_affidavit) this.affidavitFileUrl = '#';
    }

    // Acks / Declaration
    if (snap.renewal) {
      this.form.get('ackChangeNotice')?.setValue(!!snap.renewal.ack_change_notice);
      this.form.get('ackPunitiveNotice')?.setValue(!!snap.renewal.ack_punitive_notice);
      this.form.get('declaration')?.setValue(!!snap.renewal.declaration_agreed);
      this.form.get('disqualificationNote')?.setValue(snap.renewal.disqualification_note || '');
      this.form.get('currentYearActivities')?.setValue(snap.renewal.current_year_activities || '');
      this.form.get('willInformIfUnavailable')?.setValue(!!snap.renewal.will_inform_if_unavailable);
      if (snap.renewal.relationship_relation) {
        this.form.get('relationship.relation')?.setValue(snap.renewal.relationship_relation);
        this.form.get('relationship.relationDetails')?.setValue(snap.renewal.relationship_details || '');
      }
    }
  }

  // -------- GETTERS / HELPERS --------

  ctrl(path: string) {
    return this.form.get(path);
  }

  get f(): { [key: string]: AbstractControl } {
    return (this.form as FormGroup).controls;
  }
  get officesFA(): FormArray {
    return this.form.get('offices') as FormArray;
  }
  get insurersLettersFA(): FormArray {
    return this.form.get('insurersLetters') as FormArray;
  }
  get membershipsFA(): FormArray {
    return this.form.get('memberships') as FormArray;
  }

  // -------- DYNAMIC LISTS --------

  addInsurerLetter(): void {
    this.insurersLettersFA.push(
      this.fb.group({
        serverId: [null],
        file: [null, Validators.required],
        fileName: [''],
      })
    );
  }

  removeInsurerLetter(i: number): void {
    const g = this.insurersLettersFA.at(i) as FormGroup;
    const id = g.get('serverId')?.value as number | null;
    if (id && this.renewalId) {
      this.renewalSvc.removeInsurerLetter(id).subscribe({
        next: () => this.afterRemoveInsurerRow(i),
        error: () => {
          alert('Failed to remove insurer letter. Try again.');
        },
      });
    } else {
      this.afterRemoveInsurerRow(i);
    }
  }

  private afterRemoveInsurerRow(i: number) {
    this.insurersLettersFA.removeAt(i);
    this.insurersLettersNames = this.insurersLettersFA.controls.map((c) => c.get('fileName')?.value || '');
    this.cdr.markForCheck();
  }

  addMembership(): void {
    this.membershipsFA.push(
      this.fb.group({
        serverId: [null],
        organisation: ['', Validators.required],
        inGoodStanding: [false],
        certificate: [null, Validators.required],
        certificateName: [''],
      })
    );
  }

  removeMembership(i: number): void {
    const g = this.membershipsFA.at(i) as FormGroup;
    const id = g.get('serverId')?.value as number | null;
    if (id) {
      this.renewalSvc.removeMembership(id).subscribe({
        next: () => this.afterRemoveMembershipRow(i),
        error: () => alert('Failed to remove membership. Try again.'),
      });
    } else {
      this.afterRemoveMembershipRow(i);
    }
  }

  private afterRemoveMembershipRow(i: number) {
    this.membershipsFA.removeAt(i);
    this.membershipCertsNames = this.membershipsFA.controls.map((c) => c.get('certificateName')?.value || '');
    this.cdr.markForCheck();
  }

  // -------- FILES (single docs + arrays) --------

  onFileChange(e: Event, controlName: string, nameHolder?: string) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.form.get(controlName)?.setValue(file);
    if (nameHolder) this.form.get(nameHolder)?.setValue(file.name);

    // Preview URL marker for UI
    const url = URL.createObjectURL(file);
    switch (controlName) {
      case 'taxClearancePersonal':
        this.taxClearancePersonalUrl = url;
        break;
      case 'taxClearanceBusiness':
        this.taxClearanceBusinessUrl = url;
        break;
      case 'bondFacility':
        this.bondFacilityUrl = url;
        break;
      case 'affidavitFile':
        this.affidavitFileUrl = url;
        break;
    }

    // Immediate upload of single docs
    if (this.renewalId) {
      const files: any = {};
      if (controlName === 'taxClearancePersonal') files.taxClearancePersonal = file;
      if (controlName === 'taxClearanceBusiness') files.taxClearanceBusiness = file;
      if (controlName === 'bondFacility') files.bondFacility = file;
      if (controlName === 'bankAccountProof') files.bankAccountProof = file;
      if (controlName === 'affidavitFile') files.affidavitFile = file;

      if (Object.keys(files).length) {
        this.renewalSvc.uploadDocuments(this.renewalId, files).subscribe({
          next: () => {},
          error: () => alert('Upload failed. Please try again.'),
        });
      }
    }
  }

  onArrayFileChange(
    e: Event,
    arrayName: 'insurersLetters' | 'memberships',
    idx: number,
    fileField: string,
    nameField: string
  ) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const group = (this.form.get(arrayName) as FormArray).at(idx) as FormGroup;
    group.get(fileField)?.setValue(file);
    group.get(nameField)?.setValue(file.name);

    if (arrayName === 'insurersLetters') {
      this.insurersLettersNames = this.insurersLettersFA.controls.map((c) => c.get('fileName')?.value || '');

      // If we have a renewal and this row not yet uploaded, upload now
      if (this.renewalId && !group.get('serverId')?.value) {
        this.renewalSvc.addInsurerLetter(this.renewalId, file).subscribe({
          next: (res) => {
            group.get('serverId')?.setValue(res.id);
            this.cdr.markForCheck();
          },
          error: () => alert('Failed to upload insurer letter.'),
        });
      }
    } else {
      this.membershipCertsNames = this.membershipsFA.controls.map((c) => c.get('certificateName')?.value || '');

      // Try auto-upload membership if fields present
      this.tryUploadMembershipRow(idx);
    }
  }

  private tryUploadMembershipRow(i: number) {
    if (!this.renewalId) return;
    const g = this.membershipsFA.at(i) as FormGroup;
    const serverId = g.get('serverId')?.value;
    const org = g.get('organisation')?.value;
    const inGood = !!g.get('inGoodStanding')?.value;
    const cert: File | null = g.get('certificate')?.value;

    if (!serverId && org && cert) {
      this.renewalSvc.addMembership(this.renewalId, org, inGood, cert).subscribe({
        next: (res) => {
          g.get('serverId')?.setValue(res.id);
          this.cdr.markForCheck();
        },
        error: () => alert('Failed to upload membership.'),
      });
    }
  }

  // -------- VALIDATORS FOR OFFICES --------

  enforceOfficeValidators(): void {
    this.officesFA.controls.forEach((ctrl) => {
      const g = ctrl as FormGroup;
      const taking = g.get('takingAppointments')?.value === true;
      const req = taking ? [Validators.required, Validators.minLength(5)] : [];
      g.get('physicalAddress')?.setValidators(req);
      g.get('postalAddress')?.setValidators(req);
      g
        .get('telephone')
        ?.setValidators(
          taking ? [Validators.required, Validators.pattern(/^[0-9()+\-\s]{7,}$/)] : []
        );
      g.get('physicalAddress')?.updateValueAndValidity({ emitEvent: false });
      g.get('postalAddress')?.updateValueAndValidity({ emitEvent: false });
      g.get('telephone')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  // -------- TERMS & MODAL --------

  openTnC(evt?: Event): void {
    if (evt) evt.preventDefault();
    const el = document.getElementById('termsModal');
    if (!el) return;
    const ModalCtor = (window as any).bootstrap?.Modal || bootstrap?.Modal;
    const modal = ModalCtor.getOrCreateInstance ? ModalCtor.getOrCreateInstance(el) : new ModalCtor(el);
    modal.show();
  }

  acceptTnC(): void {
    // mark inner controls
    this.form.get('ackChangeNotice')?.markAsTouched();
    this.form.get('ackPunitiveNotice')?.markAsTouched();
    this.form.get('enclosures.annexA_personal')?.markAsTouched();
    this.form.get('enclosures.annexB_business')?.markAsTouched();
    this.form.get('enclosures.annexC_bond')?.markAsTouched();

    const allGood =
      this.form.get('ackChangeNotice')?.valid &&
      this.form.get('ackPunitiveNotice')?.valid &&
      this.form.get('enclosures.annexA_personal')?.valid &&
      this.form.get('enclosures.annexB_business')?.valid &&
      this.form.get('enclosures.annexC_bond')?.valid;

    if (allGood) {
      this.form.get('declaration')?.setValue(true);
      this.form.get('declaration')?.markAsTouched();

      // persist terms immediately
      if (this.renewalId) {
        this.renewalSvc
          .saveTerms(this.renewalId, {
            ackChangeNotice: true,
            ackPunitiveNotice: true,
            annexA: true,
            annexB: true,
            annexC: true,
            declaration: true,
          })
          .subscribe();
      }
    }
  }

  // -------- SUBMIT (SAVE ALL + SUBMIT) --------

  submit(): void {
    this.enforceOfficeValidators();

/*     if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    } */
  /*   if (!this.renewalId) {
      alert('No renewal in progress yet.');
      return;
    } */

    const id = this.renewalId;

    // Gather sections
    const s1 = this.form.get('section1')!.value;
    const s5 = this.form.get('section5')!.value;
    const offices = (this.officesFA.value as OfficeRow[]).map((o) => ({
      city: o.city,
      takingAppointments: !!o.takingAppointments,
      physicalAddress: o.physicalAddress || '',
      postalAddress: o.postalAddress || '',
      telephone: o.telephone || '',
    }));
    const rel = this.form.get('relationship')!.value;

    // Docs present?
    const files: any = {};
    if (this.f['taxClearancePersonal'].value) files.taxClearancePersonal = this.f['taxClearancePersonal'].value;
    if (this.f['taxClearanceBusiness'].value) files.taxClearanceBusiness = this.f['taxClearanceBusiness'].value;
    if (this.f['bondFacility'].value) files.bondFacility = this.f['bondFacility'].value;
    if (this.f['bankAccountProof'].value) files.bankAccountProof = this.f['bankAccountProof'].value;
    if (this.f['affidavitFile'].value) files.affidavitFile = this.f['affidavitFile'].value;

    this.saving = true;
    this.cdr.markForCheck();

    // Chain: personal -> business -> offices -> activities/relationship -> docs -> terms -> submit
    this.renewalSvc
      .savePersonal(id, { fullName: s1.fullName, identityNumber: s1.identityNumber })
      .pipe(
        switchMap(() =>
          this.renewalSvc.saveBusiness(id, {
            businessDetailsChange: s5.businessDetailsChange,
            businessChangeDetails: s5.businessChangeDetails || null,
            mainBusinessPhysical: s5.mainBusinessPhysical,
          })
        ),
        switchMap(() => this.renewalSvc.saveOffices(id, offices)),
        switchMap(() =>
          this.renewalSvc.saveActivitiesAndRelationship(id, {
            disqualificationNote: this.form.get('disqualificationNote')?.value || null,
            currentYearActivities: this.form.get('currentYearActivities')?.value || null,
            willInformIfUnavailable: !!this.form.get('willInformIfUnavailable')?.value,
            relation: rel.relation,
            relationDetails: rel.relation === 'related' ? rel.relationDetails : null,
          })
        ),
        switchMap(() => {
          // upload any pending single docs together (optional)
          if (Object.keys(files).length === 0) return of({ message: 'no docs' });
          return this.renewalSvc.uploadDocuments(id, files);
        }),
        switchMap(() => {
          // ensure memberships without serverId are posted
          const membershipPosts = this.membershipsFA.controls
            .map((g) => g as FormGroup)
            .filter((g) => !g.get('serverId')?.value && g.get('organisation')?.value && g.get('certificate')?.value)
            .map((g) =>
              this.renewalSvc.addMembership(
                id,
                g.get('organisation')?.value,
                !!g.get('inGoodStanding')?.value,
                g.get('certificate')?.value
              )
            );

          const insurerPosts = this.insurersLettersFA.controls
            .map((g) => g as FormGroup)
            .filter((g) => !g.get('serverId')?.value && g.get('file')?.value)
            .map((g) => this.renewalSvc.addInsurerLetter(id, g.get('file')?.value));

          if (membershipPosts.length + insurerPosts.length === 0) return of(null);
          return forkJoin([...membershipPosts, ...insurerPosts]);
        }),
        switchMap(() =>
          this.renewalSvc.saveTerms(id, {
            ackChangeNotice: true,
            ackPunitiveNotice: true,
            annexA: true,
            annexB: true,
            annexC: true,
            declaration: true,
          })
        ),
        switchMap(() => this.renewalSvc.submit(id)),
        tap(() => (this.saving = false))
      )
      .subscribe({
        next: () => {
          alert('Renewal affidavit submitted successfully.');
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving = false;
          this.cdr.markForCheck();
          alert(err?.error?.message || 'Submission failed. Please try again.');
        },
      });
  }

  // -------- LINKS --------

  openDisqualificationsPdf() {
    if (this.disqualificationsPdfUrl) {
      window.open(this.disqualificationsPdfUrl, '_blank', 'noopener');
    }
  }
}
