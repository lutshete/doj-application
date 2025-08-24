import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { finalize, map, switchMap } from 'rxjs/operators';

import {
  ApplicationReviewDto,
  AppStatus,
  LiquidatorApplicationDto,
  LiquidatorReviewService,
  Paginated,
  SignoffState,
} from 'src/app/services/liquidator-review.service';

import { RejectDialogComponent } from './dialogs/reject-dialog.component';
import { ApproveDialogComponent } from './dialogs/approve-dialog.component';
import { NoteDialogComponent } from './dialogs/note-dialog.component';
import { ExamOutcomeDialogComponent } from './dialogs/exam-outcome-dialog.component';
import { WindowsService } from 'src/app/services/windows.service';
import { AppWindow } from 'src/app/core/models';
import { of } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

type ReviewStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Exam Result'
  | string;

@Component({
  selector: 'app-liquidator-review',
  standalone: false, // set to true and add imports if using standalone
  templateUrl: './liquidator-review.component.html',
  styleUrls: ['./liquidator-review.component.scss'],
})
export class LiquidatorReviewComponent implements OnInit {
  private api = inject(LiquidatorReviewService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private winSvc = inject(WindowsService);
  private auth = inject(AuthService);
  Math = Math;
  activeWindow = signal<AppWindow | null>(null);
  reviewSavedOnce = false;

  // ---- table state
  data = signal<LiquidatorApplicationDto[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  sortField = signal<
    'createdAt' | 'decided_at' | 'submitted_at' | 'progress_percent' | 'status'
  >('createdAt');
  sortDir = signal<'asc' | 'desc'>('desc');
  loading = signal(false);

  pageCount = computed(() => {
    const t = this.total() || 0;
    const l = this.limit() || 10;
    return Math.max(1, Math.ceil(t / l));
  });

  // ---- filters
  filters = this.fb.group({
    q: [''],
    status: [''],
    windowId: [''],
    isLocked: [''],
    dateFrom: [''],
    dateTo: [''],
  });

  // ---- detail drawer
  selected: LiquidatorApplicationDto | null = null;
  drawerOpened = signal(false);

  // ---- REVIEW FORM (petite controls)
  reviewForm = this.fb.group({
    personal: this.fb.group({}),
    employment_trading: this.fb.group({ comment: [''] }),
    infrastructure_offices: this.fb.group({
      lease_agreement_confirmed: [''], // 'yes' | 'no' | ''
      comment: [''],
    }),
    qualifications_memberships: this.fb.group({
      verified_qualification: [''],
      has_professional_membership: [''], // 'yes' | 'no' | ''
      logs_valid_until: [''], // YYYY-MM-DD
      centre: [''],
    }),
    tax_bond_bank: this.fb.group({
      tax_clearance_valid_until: [''],
      bond_facility_valid_until: [''],
      has_personal_bank: [''], // 'yes' | 'no' | ''
      has_business_bank: [''], // 'yes' | 'no' | ''
      comment: [''],
    }),
    appointments_employment: this.fb.group({
      locations_comment: [''],
    }),
    misc: this.fb.group({}),
  });
  reacqInFlight = signal(false);

  private lockHeartbeat?: any;
  reviewId: string | null = null;
  activeReview: ApplicationReviewDto | null = null;
  youHoldLock(): boolean {
    const anyReview: any = this.activeReview as any;
    if (anyReview?.lock?.youHold !== undefined) return !!anyReview.lock.youHold;

    // No explicit server flag yet → treat as NOT holding to be safe
    return false;
  }
  lockUntilIso = signal<string | null>(null);

  private lockTimer?: any;
  private lockTtl = 90;
  signoffState = signal<SignoffState | null>(null);
  signoffBusy = signal(false);

  ngOnInit(): void {
    this.refreshActiveWindow();
    this.fetch();
  }

  private refreshActiveWindow(): void {
    this.winSvc.active().subscribe({
      next: (win) => this.activeWindow.set(win),
      error: () => this.activeWindow.set(null),
    });
  }

  fetch() {
    this.loading.set(true);
    this.api
      .list({
        page: this.page(),
        limit: this.limit(),
        sort: this.sortField(),
        dir: this.sortDir(),
        ...this.filters.getRawValue(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.data.set(res.items || []);
          this.total.set(res.total || 0);
          this.refreshActiveWindow(); // keep active-window state in sync
        },
        error: (err) => console.error(err),
      });
  }

  applyFilters() {
    this.page.set(1);
    this.fetch();
  }
  clearFilters() {
    this.filters.reset({
      q: '',
      status: '',
      windowId: '',
      isLocked: '',
      dateFrom: '',
      dateTo: '',
    });
    this.page.set(1);
    this.fetch();
  }

  onPageSize(size: number) {
    this.limit.set(size);
    this.page.set(1);
    this.fetch();
  }
  changePage(delta: number) {
    this.page.set(Math.max(1, Math.min(this.page() + delta, this.pageCount())));
    this.fetch();
  }

  sortBy(
    field:
      | 'createdAt'
      | 'status'
      | 'progress_percent'
      | 'submitted_at'
      | 'decided_at',
  ) {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.page.set(1);
    this.fetch();
  }

  openDetails(row: LiquidatorApplicationDto) {
    this.reviewSavedOnce = false;
    this.selected = row;
    this.api.getOne(row._id).subscribe({
      next: (full) => {
        this.selected = full;
        this.reviewSavedOnce = this.hasSavedReviewSnapshot(this.selected);
        // 1) reset form so we never carry stale values
        this.resetReviewForm();

        // 2) sensible defaults from application sections
        const s: any = full.sections || {};
        if (s.qualifications_memberships?.qualification_choice) {
          this.reviewForm.controls.qualifications_memberships.patchValue(
            {
              verified_qualification:
                s.qualifications_memberships.qualification_choice || '',
            },
            { emitEvent: false },
          );
        }
        if (s.tax_bond_bank?.bank_account_documentation) {
          this.reviewForm.controls.tax_bond_bank.patchValue(
            { has_business_bank: 'yes' },
            { emitEvent: false },
          );
        }
        if (s.infrastructure_offices?.proof_of_rental_text) {
          this.reviewForm.controls.infrastructure_offices.patchValue(
            { lease_agreement_confirmed: 'yes' },
            { emitEvent: false },
          );
        }

        // 3) get/create pending review & (optionally) acquire lock
        const latestMeetingId = (full.review_history || [])
          .slice()
          .reverse()
          .find((h: any) => !!h?.meeting_id)?.meeting_id;

        this.api
          .startReview(full._id, { meetingId: latestMeetingId })
          .subscribe({
            next: (res: any) => {
              const review = res.review as ApplicationReviewDto;

              // 4) PATCH FROM SERVER ANNEX (use your normalizer)
              const serverAnnex = (review as any)?.annex || {};
              this.patchReviewFormFromAnnex(serverAnnex); // <-- IMPORTANT

              // keep for lock UI
              this.activeReview = { ...review, lock: res.lock } as any;
              this.maybeLoadSignoff();

              // 5) begin lock heartbeat
              if (review?._id) this.startLockHeartbeat(review._id);

              this.drawerOpened.set(true);
            },
            error: () => this.drawerOpened.set(true),
          });
      },
      error: () => this.drawerOpened.set(true),
    });
  }

  refreshSelected() {
    if (!this.selected?._id) return;
    this.api.getOne(this.selected._id).subscribe({
      next: (full) => (this.selected = full),
      error: () => {},
    });
  }

  // ===== Actions =====
  markUnderReviewDialog(row: LiquidatorApplicationDto) {
    if (!this.canMarkUnderReview(row)) {
      alert(this.reviewLockReason(row));
      return;
    }
    const initialFlags = this.buildPreReviewFlags((row as any)?.sections);

    const dlg = this.dialog.open(NoteDialogComponent, {
      width: '570px',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dlg--flush',
      data: {
        title: 'Mark Under Review',
        placeholder: 'Optional note...',
        initialReviewFlags: initialFlags,
        windowId: row.window_id,
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // last 30 days
        dateTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // next 6 months
      },
    });

    dlg.afterClosed().subscribe((val) => {
      if (val == null) return;

      const comment = (val?.text || '').trim();
      const payload: any = { comment };
      if (val?.meetingId) payload.meetingId = val.meetingId;
      if (val?.annex) payload.annex = val.annex; // already an object

      const arg = val?.meetingId || val?.annex ? payload : comment;

      (this.api as any).markUnderReview(row._id, arg).subscribe({
        next: () => {
          this.fetch();
          if (this.selected?._id === row._id) this.refreshSelected();
        },
        error: (e: any) => alert(e?.error?.message || 'Failed'),
      });
    });
  }

  approveDialog(row: LiquidatorApplicationDto) {
    if (!this.canDecide(row)) {
      alert(this.decisionLockReason(row));
      return;
    }
    const now = Date.now();
    const dateFrom = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(); // last 30d
    const dateTo = new Date(now + 180 * 24 * 60 * 60 * 1000).toISOString(); // next 6mo

    const dlg = this.dialog.open(ApproveDialogComponent, {
      width: '600px',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dlg--flush',
      data: {
        windowId: row.window_id || undefined, // enables meeting picker in dialog
        dateFrom,
        dateTo,
      },
    });

    dlg.afterClosed().subscribe((val) => {
      if (!val) return;

      const payload = {
        decision: 'Approved' as const,
        comment: (val.comment || '').trim() || undefined,
        meetingId: (val.meetingId || '').trim() || undefined,
      };

      // If we already have a review id, use it; otherwise, ensure one
      const alreadyId = this.activeReview?._id;
      const latestMeetingId =
        (this.selected?.review_history || [])
          .slice()
          .reverse()
          .find((h: any) => !!h?.meeting_id)?.meeting_id || undefined;

      const ensureReview$ = alreadyId
        ? of({ _id: alreadyId } as any)
        : this.api
            .startReview(row._id, {
              meetingId: payload.meetingId || latestMeetingId,
            })
            .pipe(
              map((r: any) => {
                const review = r?.review;
                if (!review?._id)
                  throw new Error('Could not create or load a pending review.');
                // keep for lock UI
                this.activeReview = {
                  ...(review as any),
                  lock: r?.lock,
                } as any;
                this.maybeLoadSignoff();
                return review;
              }),
            );

      ensureReview$
        .pipe(
          switchMap((rev: any) => this.api.proposeDecision(rev._id, payload)),
        )
        .subscribe({
          next: (resp) => {
            alert('Decision proposed; awaiting quorum sign-offs.');
            if ((resp as any)?.review)
              this.activeReview = { ...(resp as any).review } as any;
            this.maybeLoadSignoff();
            this.fetch();
            if (this.selected?._id === row._id) this.refreshSelected();
          },
          error: (e) =>
            alert(e?.error?.message || 'Failed to propose approval'),
        });
    });
  }

  rejectDialog(row: LiquidatorApplicationDto) {
    if (!this.canDecide(row)) {
      alert(this.decisionLockReason(row));
      return;
    }
    const dlg = this.dialog.open(RejectDialogComponent, {
      width: '600px',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dlg--flush',
    });
    dlg.afterClosed().subscribe((val) => {
      if (!val?.reason) return;
      const payload: any = {
        reason: val.reason,
        meetingId: val.meetingId || undefined,
      };
      if (val.annex) {
        try {
          payload.annex = JSON.parse(val.annex);
        } catch {
          alert('ANNEX must be valid JSON');
          return;
        }
      }
      this.api.reject(row._id, payload).subscribe({
        next: () => {
          this.fetch();
          if (this.selected?._id === row._id) this.refreshSelected();
        },
        error: (e) => alert(e?.error?.message || 'Failed'),
      });
    });
  }

  openAddNoteDialog(row: LiquidatorApplicationDto) {
    const dlg = this.dialog.open(NoteDialogComponent, {
      width: '570px',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dlg--flush',
      data: {
        title: 'Add Review Note',
        placeholder: 'Note...',
        initialReviewFlags: this.buildPreReviewFlags((row as any).sections),
      },
    });
    dlg.afterClosed().subscribe((val) => {
      if (val == null) return;
      const payload: any = {
        further_comments: val?.text || '',
        meetingId: val?.meetingId || undefined,
        annex: val?.annex || undefined, // <-- already an object; do NOT parse
      };
      this.api.addReviewNote(row._id, payload).subscribe({
        next: () => {
          this.fetch();
          if (this.selected?._id === row._id) this.refreshSelected();
        },
        error: (e) => alert(e?.error?.message || 'Failed'),
      });
    });
  }

  private buildPreReviewFlags(s: any): Record<string, boolean> {
    return {
      id_document: !!s?.personal?.id_document,
      qualification:
        !!s?.qualifications_memberships?.qualification_choice ||
        !!s?.qualifications_memberships?.qualification_file,
      membership:
        !!s?.qualifications_memberships?.professional_membership_choice ||
        (Array.isArray(s?.qualifications_memberships?.memberships) &&
          s.qualifications_memberships.memberships.length > 0) ||
        !!s?.qualifications_memberships?.membership_confirmation_file,
      tax_clearance: !!s?.tax_bond_bank?.tax_clearance,
      bond_facility: !!s?.tax_bond_bank?.bond_facility,
      bank_docs: !!s?.tax_bond_bank?.bank_account_documentation,
      lease_agreement: !!s?.infrastructure_offices?.proof_of_rental_text,
      appointments: Array.isArray(
        s?.appointments_employment?.appointment_locations,
      )
        ? s.appointments_employment.appointment_locations.length > 0
        : false,
    };
  }

  examOutcomeDialog(row: LiquidatorApplicationDto) {
    if (!this.canDecide(row)) {
      alert(this.decisionLockReason(row));
      return;
    }
    const dlg = this.dialog.open(ExamOutcomeDialogComponent, {
      width: '570px',
      maxHeight: '85vh',
      autoFocus: false,
      restoreFocus: false,
      panelClass: 'dlg--flush',
    });
    dlg.afterClosed().subscribe((val) => {
      if (!val?.outcome) return;
      this.api
        .recordExamOutcome(row._id, {
          outcome: val.outcome,
          score: val.score ? Number(val.score) : undefined,
          satAt: val.satAt || undefined,
          notes: val.notes || '',
          inviteToken: val.inviteToken || undefined,
        })
        .subscribe({
          next: () => {
            this.fetch();
            if (this.selected?._id === row._id) this.refreshSelected();
          },
          error: (e) => alert(e?.error?.message || 'Failed'),
        });
    });
  }

  /** Save the review form (map to your backend as needed) */
  saveReview() {
    if (!this.selected?._id) return;

    // Require the edit lock
    if (!this.youHoldLock()) {
      alert(
        'Another reviewer is editing this review. Please try again later or use “Try take lock”.',
      );
      return;
    }

    // 1) Build annex from the petite review form
    const annex = this.reviewForm.getRawValue();

    // 2) Reuse the most recent meeting_id (if any) from the history
    const latestMeetingId =
      (this.selected?.review_history || [])
        .slice()
        .reverse()
        .find((h) => !!(h as any)?.meeting_id)?.meeting_id || undefined;

    // 3) Scrub: drop empty strings/null/undefined
    const scrub = (v: any): any => {
      if (Array.isArray(v)) return v.map(scrub);
      if (v && typeof v === 'object') {
        const o: any = {};
        Object.entries(v).forEach(([k, val]) => {
          const x = scrub(val);
          if (x !== '' && x !== undefined && x !== null) o[k] = x;
        });
        return o;
      }
      return v;
    };
    const scrubbed = scrub(annex);

    const body = {
      meetingId: latestMeetingId,
      annex: scrubbed,
      // further_comments: '...' // optional
    };

    this.api.startReview(this.selected._id, body).subscribe({
      next: (res: any) => {
        // Mark as saved this session (enables Approve/Reject gate immediately)
        this.reviewSavedOnce = true;

        // Prefer server echo as new baseline (keeps client in sync)
        const savedReview = res?.review;
        if (savedReview) {
          this.activeReview = { ...savedReview, lock: res?.lock } as any;
          // If you want to reflect server-normalized values in inputs, uncomment:
          // if (savedReview.annex) this.patchReviewFormFromAnnex(savedReview.annex);
        } else if (this.activeReview) {
          // Fallback: keep local annex baseline
          this.activeReview = {
            ...(this.activeReview as any),
            annex: scrubbed,
          } as any;
        }

        this.refreshSelected();
      },
      error: (e) => {
        const msg =
          e?.status === 423 || e?.status === 409
            ? 'Your edit lock has expired or is held by another reviewer. Use “Try take lock” and then save again.'
            : e?.error?.message || 'Failed to save review';
        alert(msg);
      },
    });
  }

  // helpers for chips/colors
  describeSection(key: unknown): string {
    const k = String(key);
    const map: Record<string, string> = {
      personal: 'Applicant identity',
      business: 'Consent & business info',
      employment_trading: 'Employer & trading partners',
      infrastructure_offices: 'Infrastructure & offices',
      qualifications_memberships: 'Qualifications & memberships',
      relationship: 'Relationships & disqualification',
      appointments_employment: 'Appointments & CV',
      tax_bond_bank: 'Tax, bond & bank',
    };
    return map[k] ?? '';
  }

  secChipClass(status?: string) {
    switch ((status || 'EMPTY').toUpperCase()) {
      case 'COMPLETE':
        return 'acc';
      case 'SAVED':
        return 'pend';
      case 'IN_PROGRESS':
        return 'warn';
      case 'EMPTY':
      default:
        return 'dec';
    }
  }

  tableStatusBadge(s?: AppStatus | string | null): string {
    switch ((s || '').toUpperCase()) {
      case 'UNDER_REVIEW':
        return 'warn';
      case 'APPROVED':
        return 'ok';
      case 'REJECTED':
        return 'bad';
      case 'LICENSED':
        return 'ok';
      case 'EXAM_FAILED':
        return 'bad';
      default:
        return '';
    }
  }

  tableStatusDot(s?: AppStatus | string | null): string {
    switch ((s || '').toUpperCase()) {
      case 'UNDER_REVIEW':
        return 'warn';
      case 'APPROVED':
        return 'ok';
      case 'REJECTED':
        return 'bad';
      case 'LICENSED':
        return 'ok';
      case 'EXAM_FAILED':
        return 'bad';
      default:
        return '';
    }
  }

  histBadgeClass(status?: ReviewStatus) {
    switch ((status || '').toLowerCase()) {
      case 'approved':
      case 'exam result':
        return 'ok';
      case 'under review':
        return 'warn';
      case 'rejected':
        return 'bad';
      case 'submitted':
      default:
        return '';
    }
  }
  histDotClass(status?: ReviewStatus) {
    switch ((status || '').toLowerCase()) {
      case 'approved':
      case 'exam result':
        return 'ok';
      case 'under review':
        return 'warn';
      case 'rejected':
        return 'bad';
      case 'submitted':
      default:
        return '';
    }
  }

  exportCSV() {
    const rows = this.data() || [];
    if (!rows.length) return;

    const header = [
      'id',
      'createdAt',
      'status',
      'progress_percent',
      'submitted_at',
      'decided_at',
      'locked',
      'applicant_name',
      'employer',
      'window_id',
    ];

    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      header.join(','),
      ...rows.map((r) => {
        const applicant = r.sections?.personal?.full_name ?? '';
        const employer = r.sections?.employment_trading?.employer_name ?? '';
        return [
          r._id,
          r.createdAt ? new Date(r.createdAt).toISOString() : '',
          r.status ?? '',
          r.progress_percent ?? 0,
          r.submitted_at ? new Date(r.submitted_at).toISOString() : '',
          (r as any).decided_at
            ? new Date((r as any).decided_at).toISOString()
            : '',
          r.is_locked ? 'LOCKED' : 'UNLOCKED',
          applicant,
          employer,
          r.window_id ?? '',
        ]
          .map(escape)
          .join(',');
      }),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `applications-page-${this.page()}-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  trackById = (_: number, row: { _id: string }) => row._id;

  // Optional: import FormGroup if you want stronger typing
  // import { FormGroup } from '@angular/forms';

  /** Safely read the misc comment for a dynamic section key */
  miscComment(key: unknown): string {
    const k = String(key);
    const misc: any = this.reviewForm.value?.misc || {};
    return misc && misc[k] && typeof misc[k].comment === 'string'
      ? misc[k].comment
      : '';
  }

  /** Safely write the misc comment for a dynamic section key */
  setMiscComment(key: unknown, value: string): void {
    const k = String(key);
    const miscCtrl: any = this.reviewForm.controls.misc; // FormGroup
    // Preserve any existing subfields under this key
    const current = (this.reviewForm.value?.misc as any)?.[k] || {};
    miscCtrl.patchValue({ [k]: { ...current, comment: value } });
  }

  /** Sections we do NOT want to render in the drawer table */
  private readonly hiddenSectionKeys = new Set([
    'business',
    'employment_trading',
    'infrastructure_offices',
  ]);

  hideSection(key: unknown): boolean {
    const k = String(key).toLowerCase();
    return this.hiddenSectionKeys.has(k);
  }

  // ----- gating helpers
  private isWindowClosed(editableUntil?: string | Date | null): boolean {
    // Strict: if there is no date or invalid → treat as NOT closed
    if (!editableUntil) return false;
    const t = new Date(editableUntil as any).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() >= t;
  }

  private isUnderReview(s?: AppStatus | string | null): boolean {
    return (s || '').toUpperCase() === 'UNDER_REVIEW';
  }

  private isDecided(s?: AppStatus | string | null): boolean {
    const v = (s || '').toUpperCase();
    return (
      v === 'APPROVED' ||
      v === 'REJECTED' ||
      v === 'LICENSED' ||
      v === 'EXAM_FAILED'
    );
  }

  private isGlobalWindowOpen(): boolean {
    return !!this.activeWindow();
  }

  // Can mark UNDER REVIEW only after window closes and not already decided
  /** Can mark UNDER REVIEW only when global window is closed and not already decided */
  canMarkUnderReview(row?: LiquidatorApplicationDto | null): boolean {
    if (!row) return false;

    const windowClosed = !this.isGlobalWindowOpen();

    // disable if status is UNDER_REVIEW or already decided
    if (row.status === 'UNDER_REVIEW') return false;

    return windowClosed && !this.isDecided(row.status);
  }

  /** Can decide (approve/reject/exam) only when global window is closed, status is UNDER_REVIEW, and not already decided */
  canDecide(row?: LiquidatorApplicationDto | null): boolean {
    if (!row) return false;
    const windowClosed = !this.isGlobalWindowOpen();
    const savedOk = this.hasSavedEvidence(row);
    return (
      windowClosed &&
      this.isUnderReview(row.status) &&
      !this.isDecided(row.status) &&
      savedOk
    );
  }

  /** Reasons shown when actions are disabled */
  reviewLockReason(row?: LiquidatorApplicationDto | null): string {
    if (!row) return 'Unavailable';
    if (this.isGlobalWindowOpen()) {
      const w = this.activeWindow();
      const when = w?.closingDate
        ? new Date(w.closingDate as any).toLocaleString()
        : '';
      return `Available after window closes${when ? ` (${when})` : ''}`;
    }
    if (this.isDecided(row.status)) return 'Already decided';
    return '';
  }

  decisionLockReason(row?: LiquidatorApplicationDto | null): string {
    if (!row) return 'Unavailable';
    if (this.isGlobalWindowOpen()) {
      const w = this.activeWindow();
      const when = w?.closingDate
        ? new Date(w.closingDate as any).toLocaleString()
        : '';
      return `Available after window closes${when ? ` (${when})` : ''}`;
    }
    if (!this.isUnderReview(row.status))
      return 'Available once application is UNDER_REVIEW';
    if (this.isDecided(row.status)) return 'Already decided';
    return '';
  }

  private toDateInput(v?: string | Date): string {
    if (!v) return '';
    const d = new Date(v as any);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  private yn(v: any): '' | 'yes' | 'no' {
    if (v === 'yes' || v === 'no' || v === '') return v;
    if (typeof v === 'boolean') return v ? 'yes' : 'no';
    const s = String(v ?? '').toLowerCase();
    if (['y', 'yes', 'true', '1'].includes(s)) return 'yes';
    if (['n', 'no', 'false', '0'].includes(s)) return 'no';
    return '';
  }

  /** Patch the petite review form from a saved annex blob */
  private patchReviewFormFromAnnex(annex: any) {
    const yn = (v: any) => {
      const s = String(v ?? '').toLowerCase();
      if (['yes', 'y', 'true', '1'].includes(s)) return 'yes';
      if (['no', 'n', 'false', '0'].includes(s)) return 'no';
      return '';
    };
    const d = (v?: string) => (v ? new Date(v).toISOString().slice(0, 10) : '');

    if (annex.infrastructure_offices) {
      this.reviewForm.controls.infrastructure_offices.patchValue({
        lease_agreement_confirmed: yn(
          annex.infrastructure_offices.lease_agreement_confirmed,
        ),
        comment: annex.infrastructure_offices.comment || '',
      });
    }
    if (annex.qualifications_memberships) {
      const qm = annex.qualifications_memberships;
      this.reviewForm.controls.qualifications_memberships.patchValue({
        verified_qualification: qm.verified_qualification || '',
        has_professional_membership: yn(qm.has_professional_membership),
        logs_valid_until: d(qm.logs_valid_until),
        centre: qm.centre || '',
      });
    }
    if (annex.tax_bond_bank) {
      const tbb = annex.tax_bond_bank;
      this.reviewForm.controls.tax_bond_bank.patchValue({
        tax_clearance_valid_until: d(tbb.tax_clearance_valid_until),
        bond_facility_valid_until: d(tbb.bond_facility_valid_until),
        has_personal_bank: yn(tbb.has_personal_bank),
        has_business_bank: yn(tbb.has_business_bank),
        comment: tbb.comment || '',
      });
    }
    if (annex.appointments_employment) {
      this.reviewForm.controls.appointments_employment.patchValue({
        locations_comment:
          annex.appointments_employment.locations_comment || '',
      });
    }
    if (annex.employment_trading?.comment) {
      this.reviewForm.controls.employment_trading.patchValue({
        comment: annex.employment_trading.comment || '',
      });
    }
    if (annex.misc && typeof annex.misc === 'object') {
      Object.entries(annex.misc).forEach(([k, v]: [string, any]) => {
        const comment =
          v && typeof v === 'object' && 'comment' in v
            ? String(v.comment ?? '')
            : String(v ?? '');
        this.setMiscComment(k, comment);
      });
    }
  }
  private stopHeartbeat() {
    if (this.lockHeartbeat) {
      clearInterval(this.lockHeartbeat);
      this.lockHeartbeat = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopLockHeartbeat();
    // optional: release explicitly if you added a release endpoint
    if (this.activeReview?._id) {
      this.api
        .releaseLock(this.activeReview._id)
        .subscribe({ next: () => {}, error: () => {} });
    }
  }

  closeDrawer() {
    // stop renewing the lock
    this.stopLockHeartbeat?.();

    // best-effort release on server
    const id = this.activeReview?._id || this.reviewId;
    if (id && (this.api as any).releaseLock) {
      this.api.releaseLock(id).subscribe({ next: () => {}, error: () => {} });
    } else if (id && (this.api as any).releaseReviewLock) {
      // if your service uses a different method name
      (this.api as any)
        .releaseReviewLock(id)
        .subscribe({ next: () => {}, error: () => {} });
    }

    // finally close the drawer
    this.reviewSavedOnce = false;
    this.drawerOpened.set(false);
  }

  startLockHeartbeat(reviewId: string) {
    if (!reviewId) return;

    this.stopLockHeartbeat();

    const tick = () => {
      this.api.acquireLock(reviewId, this.lockTtl).subscribe({
        next: (res: any) => {
          const prev = this.activeReview;
          const nextReview = res?.review;
          const lock = res?.lock ?? null;

          if (nextReview && nextReview._id) {
            // Server returned a fresh review object → take it
            this.activeReview = { ...nextReview, lock } as any;
          } else if (prev) {
            // Only lock info came back → keep previous review, just update lock
            this.activeReview = { ...prev, lock } as any;
          }
          this.maybeLoadSignoff();
          // (Optional) expose the lock expiry for UI
          const untilIso = lock?.until
            ? new Date(lock.until).toISOString()
            : null;
          this.lockUntilIso?.set?.(untilIso);
        },
        error: (e) => {
          // If lock lost, stop heartbeat and leave UI read-only
          if (e?.status === 409 || e?.status === 423) {
            this.stopLockHeartbeat();
          }
        },
      });
    };

    // Immediate attempt, then renew at ~50% of TTL
    tick();
    this.lockTimer = setInterval(tick, Math.floor(this.lockTtl * 0.5) * 1000);
  }

  stopLockHeartbeat() {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
      this.lockTimer = null;
    }
  }

  // --- add this inside the component class ---
  private resetReviewForm(): void {
    this.reviewForm.reset(
      {
        personal: {},
        employment_trading: { comment: '' },
        infrastructure_offices: { lease_agreement_confirmed: '', comment: '' },
        qualifications_memberships: {
          verified_qualification: '',
          has_professional_membership: '',
          logs_valid_until: '',
          centre: '',
        },
        tax_bond_bank: {
          tax_clearance_valid_until: '',
          bond_facility_valid_until: '',
          has_personal_bank: '',
          has_business_bank: '',
          comment: '',
        },
        appointments_employment: { locations_comment: '' },
        misc: {},
      },
      { emitEvent: false },
    );
  }

  tryReacquireLock(): void {
    const id = this.activeReview?._id;
    if (!id) return;

    this.reacqInFlight.set(true);
    this.api
      .acquireLock(id, this.lockTtl)
      .pipe(finalize(() => this.reacqInFlight.set(false)))
      .subscribe({
        next: (res) => {
          // keep latest review + lock info
          this.activeReview = { ...res.review, lock: res.lock } as any;

          // if we now hold it, (re)start the heartbeat so we keep it
          if (res.lock?.youHold && res.review?._id) {
            this.startLockHeartbeat(res.review._id);
          }
        },
        error: (e) => {
          // 409/423 = someone else still holds it
          const msg = e?.error?.message || 'Could not take the lock right now.';
          alert(msg);
        },
      });
  }

  private scrub(v: any): any {
    if (Array.isArray(v)) return v.map((x) => this.scrub(x));
    if (v && typeof v === 'object') {
      const o: any = {};
      Object.entries(v).forEach(([k, val]) => {
        const x = this.scrub(val);
        if (x !== '' && x !== undefined && x !== null) o[k] = x;
      });
      return o;
    }
    return v;
  }

  // Unsaved changes? Compare form -> activeReview.annex
  hasUnsavedChanges(): boolean {
    const current = this.scrub(this.reviewForm.getRawValue());
    const lastSaved = (this.activeReview as any)?.annex || {};
    return JSON.stringify(current) !== JSON.stringify(lastSaved);
  }

  // Approve/Reject gating = window closed + UNDER_REVIEW + lock + saved once + no unsaved changes
  canApproveOrReject(a?: LiquidatorApplicationDto | null): boolean {
    if (!a) return false;
    return (
      this.canDecide(a) &&
      this.youHoldLock() &&
      this.reviewSavedOnce &&
      !this.hasUnsavedChanges()
    );
  }

  // Exam outcome only after a decision (Approved or Rejected)
  canRecordExam(a?: LiquidatorApplicationDto | null): boolean {
    if (!a) return false;

    // Only after the global window closes…
    if (this.isGlobalWindowOpen()) return false;

    // …and only when the application has a decision (Approved/Rejected)
    const s = String(a.status || '').toUpperCase();
    return s === 'APPROVED' || s === 'REJECTED';
  }

  private isAnnexFromForm(annex: any): boolean {
    if (!annex || typeof annex !== 'object') return false;
    const formKeys = [
      'personal',
      'employment_trading',
      'infrastructure_offices',
      'qualifications_memberships',
      'tax_bond_bank',
      'appointments_employment',
      'misc',
    ];
    return formKeys.some(
      (k) =>
        annex[k] &&
        typeof annex[k] === 'object' &&
        Object.keys(annex[k]).length > 0,
    );
  }

  private hasSavedReviewSnapshot(
    row?: LiquidatorApplicationDto | null,
  ): boolean {
    if (!row || !Array.isArray(row.review_history)) return false;
    return row.review_history.some((h: any) => this.isAnnexFromForm(h?.annex));
  }

  // --- helper: overall “saved evidence” (either this session, or previously)
  // was: private hasSavedEvidence(...)
  hasSavedEvidence(row?: LiquidatorApplicationDto | null): boolean {
    if (!row) return false;
    const hist = (row.review_history || []).slice().reverse();

    // use the latest "Under Review" snapshot
    const latest = hist.find(
      (h) => String(h.review_status || '').toLowerCase() === 'under review',
    );
    if (!latest) return false;

    const hasComment = !!String(latest.further_comments || '').trim();
    const hasAnnex = !!(
      latest.annex &&
      typeof latest.annex === 'object' &&
      Object.keys(latest.annex).length > 0
    );
    return hasComment || hasAnnex;
  }

  // Load status when a review is proposed (Approved/Rejected) and still Pending
  private maybeLoadSignoff(): void {
    const r = this.activeReview as any;
    const proposed =
      r?._id &&
      r?.meeting_id &&
      r?.review_status &&
      String(r.review_status).toLowerCase() !== 'under review' &&
      String(r.outcome || 'Pending') === 'Pending';

    if (!proposed) {
      this.signoffState.set(null);
      return;
    }
    this.api.signoffStatus(r._id).subscribe({
      next: (s) => this.signoffState.set(s),
      error: () => this.signoffState.set(null),
    });
  }

  doSignoff(approve: boolean) {
    const id = this.activeReview?._id;
    if (!id) return;
    this.signoffBusy.set(true);
    this.api
      .signoff(id, approve)
      .pipe(finalize(() => this.signoffBusy.set(false)))
      .subscribe({
        next: () => {
          // refresh counts; if threshold reached, backend finalizes the app
          this.api.signoffStatus(id).subscribe({
            next: (s) => this.signoffState.set(s),
            error: () => {},
          });
          this.fetch();
          if (this.selected?._id) this.refreshSelected();
        },
        error: (e) => alert(e?.error?.message || 'Failed to record sign-off'),
      });
  }
  decisionProposedPending(): boolean {
    const r: any = this.activeReview;
    if (!r) return false;
    const status = String(r.review_status || '').toLowerCase();
    const outcome = String(r.outcome || 'Pending');
    return !!r.meeting_id && status !== 'under review' && outcome === 'Pending';
  }

// inside LiquidatorReviewComponent
canSeeSignoffBanner(): boolean {
  if (!this.decisionProposedPending()) return false;
  const s = this.signoffState();
  if (!s) return false;
  const me = this.auth.user?.id;
  return !(me && Array.isArray(s.hideBannerForUserIds) &&
           s.hideBannerForUserIds.some(id => String(id) === String(me)));
}

inputsDisabled(a?: LiquidatorApplicationDto | null): boolean {
  if (!a) return true;
  if (this.isDecided(a.status)) return true;   // finalized -> everyone read-only
  return !this.youHoldLock();                  // not finalized -> need lock to edit
}

}
