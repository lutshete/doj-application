import { Component, OnInit, inject } from '@angular/core';
import { WindowsService } from '../../services/windows.service';
import { MeetingsService } from '../../services/meetings.service';
import { MatDialog } from '@angular/material/dialog';
import { WindowEditorDialog } from './_dialog/window-editor.dialog';
import { MeetingEditorDialog } from './_dialog/meeting-editor.dialog';
import { TopAlertService } from 'src/app/services/top-alert.service';
import { finalize } from 'rxjs';
import { NotifyService } from 'src/app/services/notify.service';

type AppWindow = {
  _id: string;
  openingDate: string | Date;
  closingDate: string | Date;
  extendedDays?: number;
  isExtended?: boolean;
  status?: 'PLANNED' | 'OPEN' | 'CLOSED';
  windowYear?: number;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type QuorumMember = {
  userId: string;
  response: 'PENDING' | 'ACCEPT' | 'DECLINE';
  responseToken?: string;
  respondedAt?: string | Date;
  declineReason?: string | null;
};

type Meeting = {
  _id: string;
  windowId: string;
  start: string | Date;
  end: string | Date;
  link?: string;
  venue?: string;
  quorum: QuorumMember[];
  quorumRequired?: number;
  minutes?: string;
  minutesFiles?: Array<{
    url: string;
    name: string;
    mime: string;
    size: number;
  }>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

@Component({
  selector: 'app-windows',
  templateUrl: './windows.component.html',
  styleUrls: ['./windows.component.scss'],
})
export class WindowsComponent implements OnInit {
  private winSvc = inject(WindowsService);
  private meetSvc = inject(MeetingsService);
  private dialog = inject(MatDialog);
  private alerts = inject(TopAlertService);
  private notify = inject(NotifyService);

  windows: AppWindow[] = [];
  meetingsByWindow: Record<string, Meeting[]> = {};
  loading = false;
  counts = { open: 0, upcoming: 0, closed: 0 };

  ngOnInit() {
    this.load();
  }

  private computeCounts(): void {
    const c = { open: 0, upcoming: 0, closed: 0 };
    for (const w of this.windows) {
      const s = this.statusFor(w);
      if (s === 'OPEN') c.open++;
      else if (s === 'UPCOMING') c.upcoming++;
      else if (s === 'CLOSED') c.closed++;
    }
    this.counts = c;
  }

  load() {
    this.loading = true;
    this.winSvc.list().subscribe({
      next: (ws: AppWindow[]) => {
        this.windows = (ws || []).sort(
          (a, b) => +new Date(b.openingDate) - +new Date(a.openingDate),
        );
        this.computeCounts();
        // fetch meetings per window
        this.windows.forEach((w) => {
          this.meetSvc.listForWindow(w._id).subscribe((ms) => {
            this.meetingsByWindow[w._id] = (ms || []).sort(
              (a, b) => +new Date(a.start) - +new Date(b.start),
            );
          });
        });
      },
      error: () => {},
      complete: () => (this.loading = false),
    });
  }

  // ---------- Actions ----------
  createWindow() {
    this.dialog
      .open(WindowEditorDialog)
      .afterClosed()
      .subscribe((v: any) => {
        if (!v) return;
        this.winSvc.create(v.opening, v.closing).subscribe(() => this.load());
      });
  }

extendClosing(w: AppWindow) {
  this.dialog
    .open(WindowEditorDialog, { data: { current: w } })
    .afterClosed()
    .subscribe((v: any) => {
      if (!v?.closing) return;

      const days = this.diffDays(
        String(w.closingDate).slice(0, 10),
        String(v.closing).slice(0, 10),
      );

      if (days < 1 || days > 7) {
        this.alerts.show({
          type: 'warn',
          message:
            'Extension must be 1–7 days beyond the current closing date.',
          timeout: 6000,
        });
        return;
      }

      // optional: disable the row’s buttons while extending
      this.busy[w._id] = true;

      this.winSvc
        .extend(w._id, days)
        .pipe(finalize(() => (this.busy[w._id] = false)))
        .subscribe({
          next: (res: any) => {
            const newClose =
              res?.closingDate
                ? new Date(res.closingDate)
                : new Date(v.closing);
            const label = newClose.toLocaleDateString(undefined, {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            this.alerts.show({
              type: 'ok',
              message: `Closing extended by ${days} day${days === 1 ? '' : 's'}. New closing: ${label}.`,
              timeout: 6000,
            });
            this.load();
          },
          error: (e) => {
            this.alerts.show({
              type: 'error',
              message: e?.error?.message || 'Failed to extend closing date.',
              timeout: 7000,
            });
          },
        });
    });
}

  scheduleMeeting(w: AppWindow) {
    this.dialog
      .open(MeetingEditorDialog, { data: { closingDate: w.closingDate } })
      .afterClosed()
      .subscribe((v: any) => {
        if (!v) return;
        this.meetSvc
          .createForWindow(w._id, {
            start: v.start,
            end: v.end,
            link: v.link,
            venue: v.venue,
          })
          .subscribe(() => this.load());
      });
  }

  editMeeting(m: any) {
    this.dialog
      .open(MeetingEditorDialog, { data: { meeting: m, closingDate: m.start } })
      .afterClosed()
      .subscribe((v: any) => {
        if (!v) return;
        this.meetSvc
          .updateMeeting(m._id, {
            start: v.start,
            end: v.end,
            link: v.link,
            venue: v.venue,
          })
          .subscribe(() => this.load());
      });
  }

  inviteQuorum(m: any) {
    const csv = prompt('Enter comma-separated user IDs to invite to quorum:');
    if (!csv) return;
    const ids = csv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return;
    this.meetSvc.inviteQuorum(m._id, ids).subscribe(() => this.load());
  }

  // ---------- Helpers ----------
  trackByWindow = (_: number, w: AppWindow) => w._id;
  trackByMeeting = (_: number, m: Meeting) => m._id;

  statusFor(w: AppWindow): 'UPCOMING' | 'OPEN' | 'CLOSED' | 'PLANNED' {
    const now = new Date();
    const openAt = new Date(w.openingDate);
    const closeAt = new Date(w.closingDate);
    const explicit = (w.status || '').toUpperCase();

    // Date always caps CLOSED
    if (now > closeAt) return 'CLOSED';

    // Honor explicit states
    if (explicit === 'CLOSED') return 'CLOSED';
    if (explicit === 'OPEN') return 'OPEN';

    // Planned: before opening it’s upcoming; between dates but not flipped → still PLANNED
    if (explicit === 'PLANNED') {
      if (now < openAt) return 'UPCOMING';
      return 'PLANNED'; // within window but not opened yet (manual/cron not run)
    }

    // Fallback if no status provided
    if (now < openAt) return 'UPCOMING';
    return 'OPEN';
  }

  daysDiff(a: Date | string, b: Date | string) {
    const d1 = new Date(a);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(b);
    d2.setHours(0, 0, 0, 0);
    return Math.round((+d2 - +d1) / 86400000);
  }

  private diffDays(startISO: string, endISO: string): number {
    const a = new Date(startISO);
    a.setHours(12, 0, 0, 0);
    const b = new Date(endISO);
    b.setHours(12, 0, 0, 0);
    return Math.round((+b - +a) / 86400000);
  }

  countdownLabel(w: AppWindow) {
    const today = new Date();
    const s = this.statusFor(w);

    if (s === 'UPCOMING' || s === 'PLANNED') {
      const d = this.daysDiff(today, w.openingDate);
      if (d === 0) return 'Opens today';
      return `Opens in ${d} day${d === 1 ? '' : 's'}`;
    }

    if (s === 'OPEN') {
      const d = this.daysDiff(today, w.closingDate);
      if (d < 0)
        return `Closed ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} ago`;
      if (d === 0) return 'Closes today';
      return `Closes in ${d} day${d === 1 ? '' : 's'}`;
    }

    return 'Closed';
  }

  meetingSnapshot(m?: Meeting) {
    if (!m) return 'No meeting scheduled';
    const acc = (m.quorum || []).filter((q) => q.response === 'ACCEPT').length;
    const tot = (m.quorum || []).length;
    const dt = new Date(m.start);
    return `${dt.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • ${acc}/${tot} accepted`;
  }

  acceptedCount(m: Meeting) {
    return (m.quorum || []).filter((q) => q.response === 'ACCEPT').length;
  }
  pendingCount(m: Meeting) {
    return (m.quorum || []).filter((q) => q.response === 'PENDING').length;
  }
  declinedCount(m: Meeting) {
    return (m.quorum || []).filter((q) => q.response === 'DECLINE').length;
  }

  // windows.component.ts (add method)
  // In WindowsComponent
  busy: Record<string, boolean> = {};

  async openNow(w: AppWindow) {
    const ok = await this.alerts.confirm('Open this window now?', {
      type: 'warn',
      okLabel: 'Open now',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;

    this.busy[w._id] = true;

    this.winSvc
      .open(w._id)
      .pipe(finalize(() => (this.busy[w._id] = false)))
      .subscribe({
        next: async () => {
          // Pop a system notification (if permitted) OR show a toast fallback
          await this.notify.notify({
            title: 'Window opened',
            body: 'The application window is now OPEN.',
            type: 'ok',
            timeout: 5000,
            // icon: '/assets/notify-ok.png', // optional
          });
          this.load();
        },
        error: async (e) => {
          await this.notify.notify({
            title: 'Failed to open window',
            body: e?.error?.message || 'Please try again.',
            type: 'error',
            timeout: 7000,
          });
        },
      });
  }

async closeNow(w: AppWindow) {
  const ok = await this.alerts.confirm('Close this window now?', {
    type: 'warn',
    okLabel: 'Close now',
    cancelLabel: 'Cancel',
  });
  if (!ok) return;

  this.busy[w._id] = true;

  this.winSvc
    .close(w._id)
    .pipe(finalize(() => (this.busy[w._id] = false)))
    .subscribe({
      next: () => {
        this.alerts.show({
          type: 'ok',
          message: 'Window closed successfully.',
          timeout: 5000,
        });
        this.load();
      },
      error: (e) => {
        this.alerts.show({
          type: 'error',
          message: e?.error?.message || 'Failed to close window.',
          timeout: 7000,
        });
      },
    });
}






}
