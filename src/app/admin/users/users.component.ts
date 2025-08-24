import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { UserLite, Role } from '../../core/models';
import { MatDialog } from '@angular/material/dialog';
import { ApproveDeclineDialog } from './_dialog/approve-decline.dialog';
import { AdminFlagDialog } from './_dialog/admin-flag.dialog';
import { UserAuditDrawer } from './user-audit.drawer';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private svc = inject(UsersService);
  private dialog = inject(MatDialog);

  users = signal<UserLite[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  q = signal('');
  role = signal<Role | ''>('');
  active = signal<'all'|'active'|'inactive'>('all');
  approval = signal<'all'|'PENDING'|'APPROVED'|'DECLINED'|'NOT_REQUIRED'>('all');
  sort = signal<'createdAt'|'lastLoginAt'|'firstName'|'lastName'|'email'|'role'>('createdAt');
  dir = signal<'asc'|'desc'>('desc');

  // NEW: loading state + selection
  loading = signal<boolean>(false);
  selected = signal<string[]>([]);

  pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  range = computed(() => {
    const start = (this.page() - 1) * this.limit() + 1;
    const end = (this.page() - 1) * this.limit() + this.users().length;
    return { start: Math.min(start, this.total() || 0), end: Math.min(end, this.total() || 0) };
  });

  me = JSON.parse(localStorage.getItem('me') || '{}');

  skeletonRows = Array.from({ length: 6 });

  ngOnInit(){ this.load(); }

  load() {
    this.loading.set(true);
    this.svc.list({
      page: this.page(), limit: this.limit(),
      q: this.q() || undefined,
      role: this.role() || undefined,
      isActive: this.active()==='all' ? undefined : this.active()==='active',
      approvalStatus: this.approval()==='all' ? undefined : this.approval(),
      sort: this.sort(), dir: this.dir()
    }).subscribe({
      next: (r) => {
        this.users.set(r.items || []);
        this.total.set(r.total ?? (r.items?.length || 0));
        if (this.page() > this.pageCount()) this.page.set(this.pageCount());
        // drop selections that are not on the current page
        const idsOnPage = new Set((r.items || []).map((x:any)=>x._id));
        this.selected.update(sel => sel.filter(id => idsOnPage.has(id)));
      },
      error: () => {},
      complete: () => this.loading.set(false)
    });
  }

  // Sorting
  sortBy(field: typeof this.sort extends any ? any : never){
    if (this.sort() === field) {
      this.dir.set(this.dir()==='asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(field);
      this.dir.set('asc');
    }
    this.page.set(1);
    this.load();
  }

  resetFilters(){
    this.q.set(''); this.role.set(''); this.active.set('all'); this.approval.set('all');
    this.sort.set('createdAt'); this.dir.set('desc');
    this.page.set(1); this.load();
  }
  changePage(delta: number){
    const next = Math.min(this.pageCount(), Math.max(1, this.page() + delta));
    if (next !== this.page()) { this.page.set(next); this.load(); }
  }

  trackById = (_: number, u: UserLite) => u?._id ?? u?.email ?? _;

  // Selection helpers
  isSelected = (id: string) => this.selected().includes(id);
  toggle(id: string, checked: boolean){
    this.selected.update(arr => checked ? Array.from(new Set([...arr, id])) : arr.filter(x => x!==id));
  }
  allSelectedOnPage(){
    const ids = this.users().map(u=>u._id);
    return ids.length>0 && ids.every(id => this.selected().includes(id));
  }
  someSelectedOnPage(){
    const ids = this.users().map(u=>u._id);
    const count = ids.filter(id => this.selected().includes(id)).length;
    return count>0 && count<ids.length;
  }
  toggleSelectAllOnPage(checked: boolean){
    const ids = this.users().map(u=>u._id);
    this.selected.update(sel => checked
      ? Array.from(new Set([...sel, ...ids]))
      : sel.filter(id => !ids.includes(id)));
  }

  // Bulk ops (simple parallel calls; adjust if you expose bulk endpoints)
  bulkApprove(){
    const ids = this.pickOfficialsNeeding('APPROVED');
    ids.forEach(id => this.svc.approveOfficial(id).subscribe({ complete: ()=>this.loadIfLast(id, ids) }));
  }
  bulkDecline(){
    const ids = this.pickOfficialsNeeding('DECLINED');
    ids.forEach(id => this.svc.declineOfficial(id, 'Bulk decline').subscribe({ complete: ()=>this.loadIfLast(id, ids) }));
  }
  bulkDeactivate(){
    const ids = this.selected();
    ids.forEach(id => this.svc.deactivate(id).subscribe({ complete: ()=>this.loadIfLast(id, ids) }));
  }
  bulkActivate(){
    const ids = this.selected();
    ids.forEach(id => this.svc.activate(id).subscribe({ complete: ()=>this.loadIfLast(id, ids) }));
  }
  private loadIfLast(id: string, all: string[]){
    if (id === all[all.length-1]) { this.selected.set([]); this.load(); }
  }
  private pickOfficialsNeeding(target: 'APPROVED'|'DECLINED'){
    const set = new Set(this.selected());
    return this.users()
      .filter(u=> set.has(u._id) && u.role==='OFFICIAL' && (u.approval?.status||'') !== target)
      .map(u=>u._id);
  }

  // Row actions (existing)
  approve(u: UserLite) {
    this.dialog.open(ApproveDeclineDialog, { data: { mode:'approve', user:u }})
      .afterClosed().subscribe(ok => ok && this.svc.approveOfficial(u._id).subscribe(()=>this.load()));
  }
  decline(u: UserLite) {
    this.dialog.open(ApproveDeclineDialog, { data: { mode:'decline', user:u }})
      .afterClosed().subscribe((reason?:string) => {
        if (reason===undefined) return;
        this.svc.declineOfficial(u._id, reason).subscribe(()=>this.load());
      });
  }
  toggleAdmin(u: UserLite) {
    this.dialog.open(AdminFlagDialog, { data: { user:u }})
      .afterClosed().subscribe((val?: boolean) => {
        if (val===undefined) return;
        this.svc.setAdminFlag(u._id, val).subscribe(()=>this.load());
      });
  }
  deactivate(u: UserLite){ this.svc.deactivate(u._id).subscribe(()=>this.load()); }
  activate(u: UserLite){ this.svc.activate(u._id).subscribe(()=>this.load()); }
  forceResetEmail(u: UserLite){ this.svc.requestPasswordReset(u.email).subscribe(); }

  openAudit(u: UserLite) {
    this.dialog.open(UserAuditDrawer, { data: { userId: u._id, email: u.email }, panelClass: 'drawer-right' });
  }
  copy(email: string){ if (!email) return; navigator.clipboard?.writeText(email).catch(()=>{}); }

  // CSV export (current page)
  exportCSV(){
    const rows = this.users().map(u => ({
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      approval: u.approval?.status || '',
      lastLoginAt: u.lastLoginAt || '',
      createdAt: u.createdAt || ''
    }));
    const csv = this.toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `users_page${this.page()}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  private toCSV(rows: any[]){
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const esc = (v:any) => `"${String(v ?? '').replace(/"/g,'""')}"`;
    const lines = [headers.map(esc).join(',')];
    for (const r of rows) lines.push(headers.map(h => esc((r as any)[h])).join(','));
    return lines.join('\n');
  }
}
