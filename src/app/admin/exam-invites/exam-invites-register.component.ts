import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ExamInvitesService, ExamInvite, InviteStatus } from '../../services/exam-invites.service';

@Component({
  selector: 'app-exam-invites-register',
  templateUrl: './exam-invites-register.component.html',
  styleUrls: ['./exam-invites-register.component.scss']
})
export class ExamInvitesRegisterComponent implements OnInit {
  private svc = inject(ExamInvitesService);

  invites = signal<ExamInvite[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(20);
  q = signal('');
  status = signal<InviteStatus | ''>('');
  // token removed from sort union
  sort = signal<'createdAt'|'updatedAt'|'status'|'respondedAt'>('createdAt');
  dir  = signal<'asc'|'desc'>('desc');
  loading = signal(false);

  pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  range = computed(() => {
    const start = (this.page() - 1) * this.limit() + (this.invites().length ? 1 : 0);
    const end = (this.page() - 1) * this.limit() + this.invites().length;
    return { start, end };
  });

  skeletonRows = Array.from({ length: 6 });

  // Register panel
  token = signal('');
  seat = signal('');
  note = signal('');
  lookup = signal<any|null>(null);
  regBusy = signal(false);
  toast = signal<string|undefined>(undefined);

  ngOnInit(){ this.load(); }

  load(){
    this.loading.set(true);
    this.svc.list({
      q: this.q() || undefined,
      status: this.status() || undefined,
      sort: this.sort(), dir: this.dir(),
      page: this.page(), limit: this.limit()
    }).subscribe({
      next: (r) => { this.invites.set(r.items || []); this.total.set(r.total || 0); },
      complete: () => this.loading.set(false)
    });
  }

  sortBy(field: 'createdAt'|'updatedAt'|'status'|'respondedAt'){
    if (this.sort() === field) this.dir.set(this.dir()==='asc'?'desc':'asc');
    else { this.sort.set(field); this.dir.set('asc'); }
    this.page.set(1); this.load();
  }

  resetFilters(){
    this.q.set(''); this.status.set(''); this.sort.set('createdAt'); this.dir.set('desc');
    this.page.set(1); this.load();
  }

  changePage(delta: number){
    const next = Math.min(this.pageCount(), Math.max(1, this.page() + delta));
    if (next !== this.page()) { this.page.set(next); this.load(); }
  }

  trackById = (_: number, x: ExamInvite) => x?._id ?? _;

  copy(v?: string){
    if (!v) return;
    navigator.clipboard?.writeText(v).then(()=>this.flash('Copied'));
  }

  // --- Register panel actions (token is used only here, not displayed in the table)
  findByToken(){
    const t = (this.token()||'').trim();
    if (!t) { this.lookup.set(null); return; }
    this.regBusy.set(true);
    this.svc.statusByToken(t).subscribe({
      next: (r) => { this.lookup.set(r); },
      error: () => { this.lookup.set(null); this.flash('Invite not found'); },
      complete: () => this.regBusy.set(false)
    });
  }

  checkIn(){
    const token = (this.token()||'').trim();
    if (!token) return;
    this.regBusy.set(true);
    this.svc.checkInByToken({ token, seat: this.seat() || undefined, note: this.note() || undefined })
      .subscribe({
        next: () => { this.flash('Checked in'); this.findByToken(); },
        error: () => this.flash('Check-in failed'),
        complete: () => this.regBusy.set(false)
      });
  }

  checkOut(){
    const token = (this.token()||'').trim();
    if (!token) return;
    this.regBusy.set(true);
    this.svc.checkOutByToken({ token })
      .subscribe({
        next: () => { this.flash('Checked out'); this.findByToken(); },
        error: () => this.flash('Check-out failed'),
        complete: () => this.regBusy.set(false)
      });
  }

  // Quick actions still use row.token internally, but do not render it anywhere
  quickCheckIn(row: ExamInvite){
    this.token.set(row.token); // not shown; just used
    this.findByToken();
    this.checkIn();
  }
  quickCheckOut(row: ExamInvite){
    this.token.set(row.token); // not shown; just used
    this.findByToken();
    this.checkOut();
  }

  private flash(msg: string){
    this.toast.set(msg);
    setTimeout(()=> this.toast.set(undefined), 2000);
  }
}
