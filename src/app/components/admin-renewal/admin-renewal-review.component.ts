import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
} from '@angular/forms';
import {
  RenewalService,
  RenewalSnapshot,
  AdminReviewPayload,
  InsurerLetterRow,
  MembershipRow,
} from '../../services/renewal.service';

type ReviewStatus = 'Under Review' | 'Approved' | 'Rejected' | 'Submitted';
type Outcome = 'Pending' | 'Approved' | 'Rejected';

export interface RenewalHeader {
  renewal_id: number;
  user_id: number;
  application_id: number | null;
  application_dates_id: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  last_saved_at: string;

  // added so template can read them
  opening_date?: string | null;
  closing_date?: string | null;

  declaration_agreed: 0 | 1;
  ack_change_notice: 0 | 1;
  ack_punitive_notice: 0 | 1;
  annexA_personal: 0 | 1;
  annexB_business: 0 | 1;
  annexC_bond: 0 | 1;
  disqualification_note?: string | null;
  current_year_activities?: string | null;
  will_inform_if_unavailable?: 0 | 1;
  relationship_relation?: 'not_related' | 'related' | null;
  relationship_details?: string | null;
}


type AdminReviewForm = {
  review_status: FormControl<ReviewStatus>;
  outcome: FormControl<Outcome>;
  further_comments: FormControl<string>;
  annexA_comment: FormControl<string>;
  annexB_comment: FormControl<string>;
  annexC_comment: FormControl<string>;
  reviewer_id: FormControl<number | null>;
};

@Component({
  selector: 'app-admin-renewal-review',
  templateUrl: './admin-renewal-review.component.html',
  styleUrls: ['./admin-renewal-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRenewalReviewComponent implements OnInit {
  renewalId!: number;
  snap: RenewalSnapshot | null = null;

  loading = false;
  saving = false;
  error: string | null = null;

  form!: FormGroup<AdminReviewForm>;

  // (optional) expose choices to the template if you need selects
  readonly REVIEW_STATUSES: ReviewStatus[] = [
    'Under Review',
    'Approved',
    'Rejected',
    'Submitted',
  ];
  readonly OUTCOMES: Outcome[] = ['Pending', 'Approved', 'Rejected'];

  constructor(
    private route: ActivatedRoute,
    private fb: NonNullableFormBuilder,
    private svc: RenewalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const parsed = Number(rawId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      this.error = 'Invalid renewal id';
      return;
    }
    this.renewalId = parsed;

    this.form = this.fb.group<AdminReviewForm>({
      review_status: this.fb.control<ReviewStatus>('Under Review'),
      outcome: this.fb.control<Outcome>('Pending'),
      further_comments: this.fb.control(''),
      annexA_comment: this.fb.control(''),
      annexB_comment: this.fb.control(''),
      annexC_comment: this.fb.control(''),
      reviewer_id: new FormControl<number | null>(null),
    });

    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.svc.adminGetRenewal(this.renewalId).subscribe({
      next: (snap) => {
        this.snap = snap;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load renewal.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Quick actions
  setUnderReview(): void {
    this.form.patchValue({ review_status: 'Under Review', outcome: 'Pending' });
  }
  approve(): void {
    this.form.patchValue({ review_status: 'Approved', outcome: 'Approved' });
  }
  reject(): void {
    this.form.patchValue({ review_status: 'Rejected', outcome: 'Rejected' });
  }

  submitReview(): void {
    if (!this.snap) return;

    this.saving = true;
    this.error = null;
    this.cdr.markForCheck();

    const raw = this.form.getRawValue();
    // Map form values -> payload (strip empty strings to undefined)
    const payload: AdminReviewPayload = {
      review_status: raw.review_status,
      outcome: raw.outcome,
      further_comments: raw.further_comments?.trim() || undefined,
      annexA_comment: raw.annexA_comment?.trim() || undefined,
      annexB_comment: raw.annexB_comment?.trim() || undefined,
      annexC_comment: raw.annexC_comment?.trim() || undefined,
      reviewer_id: raw.reviewer_id ?? undefined,
    };

    this.svc.adminReviewRenewal(this.renewalId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.load(); // refresh latest status timeline
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Failed to save review.';
        this.cdr.markForCheck();
      },
    });
  }

  // Downloads (insurer letter / membership certificate)
  downloadInsurerLetter(row: InsurerLetterRow): void {
    // Make sure RenewalService has a method that GETs:
    // /api/admin/renewals/insurer-letters/:id/download with responseType 'blob'
    (this.svc as any).adminDownloadInsurerLetter(row.id).subscribe({
      next: (blob: Blob) =>
        this.saveBlob(blob, row.file_name || `insurer-letter-${row.id}.pdf`),
      error: () => alert('Failed to download letter.'),
    });
  }

  downloadMembershipCert(row: MembershipRow): void {
    const name = (row as any).certificate_name || `membership-cert-${row.id}.pdf`;
    // Make sure RenewalService has a method that GETs:
    // /api/admin/renewals/memberships/:id/download with responseType 'blob'
    (this.svc as any).adminDownloadMembershipCert(row.id).subscribe({
      next: (blob: Blob) => this.saveBlob(blob, name),
      error: () => alert('Failed to download certificate.'),
    });
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Helpers for view
  get hasDocs() {
    return this.snap?.documents;
  }
  get fullName() {
    return this.snap?.personal?.full_name || '—';
  }
}
