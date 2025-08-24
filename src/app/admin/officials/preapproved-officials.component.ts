import { Component, inject, signal } from '@angular/core';
import { OfficialsService, Preapproved } from '../../services/officials.service';

@Component({
  selector: 'app-preapproved-officials',
  templateUrl: './preapproved-officials.component.html',
  styleUrls: ['./preapproved-officials.component.scss'],
})
export class PreapprovedOfficialsComponent {
  private svc = inject(OfficialsService);

  /** ---- UI state (signals) ---- */
  q = signal<string>('');                       // search query (email or notes)
  role = signal<string>('');                    // OFFICIAL | CHIEF_MASTER | ''
  sort = signal<'email'|'role'|'notes'|'createdAt'>('createdAt');
  dir  = signal<'asc'|'desc'>('desc');
  page = signal<number>(1);                     // 1-based
  limit = signal<number>(20);
  total = signal<number>(0);
  loading = signal<boolean>(false);

  /** ---- data ---- */
  private all: Preapproved[] = [];              // full list from server
  rows: Preapproved[] = [];                     // current page rows
  skeletonRows = Array.from({ length: 6 });

  /** ---- form ---- */
  form: Preapproved = { email: '', role: 'OFFICIAL', notes: '' };

  ngOnInit() { this.load(); }

  /** Fetch from API, then render page (client-side filter/sort/paginate). */
  load() {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: (r) => {
        this.all = r || [];
        // clamp page if data shrank
        const maxPage = this._pageCountAfter(this.all.length);
        if (this.page() > maxPage) this.page.set(maxPage);
        this.render();
      },
      error: () => {
        this.all = [];
        this.render();
      },
      complete: () => this.loading.set(false)
    });
  }

  /** Save create/update; then reset form and reload. */
  save() {
    const dto: Preapproved = {
      _id: this.form._id,
      email: (this.form.email || '').trim(),
      role: this.form.role || 'OFFICIAL',
      notes: (this.form.notes || '').trim()
    };
    const req$ = dto._id ? this.svc.update(dto._id, dto) : this.svc.create(dto);
    req$.subscribe(() => {
      this.cancel();
      this.load();
    });
  }

  edit(r: Preapproved) { this.form = { ...r }; }

  remove(id?: string) {
    if (!id) return;
    if (!confirm('Delete this pre-approval?')) return;
    this.svc.remove(id).subscribe(() => this.load());
  }

  cancel() { this.form = { email: '', role: 'OFFICIAL', notes: '' }; }

  /** ---- Helpers expected by template ---- */
  trackById = (_: number, r: Preapproved) => r?._id ?? _;

  copy(email: string) { navigator.clipboard?.writeText(email || ''); }

  /** Sorting toggle */
  sortBy(field: 'email' | 'role' | 'notes' | 'createdAt') {
    if (this.sort() === field) {
      this.dir.set(this.dir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sort.set(field);
      this.dir.set('asc');
    }
    this.page.set(1);
    this.render();
  }

  changePage(delta: number) {
    const next = Math.min(Math.max(1, this.page() + delta), this.pageCount());
    if (next !== this.page()) {
      this.page.set(next);
      this.render();
    }
  }

  resetFilters() {
    this.q.set('');
    this.role.set('');
    this.sort.set('createdAt');
    this.dir.set('desc');
    this.page.set(1);
    this.render();
  }

  /** Pager helpers for header */
  range() {
    const start = (this.page() - 1) * this.limit() + (this.rows.length ? 1 : 0);
    const end = (this.page() - 1) * this.limit() + this.rows.length;
    return { start, end };
  }

  pageCount() { return Math.max(1, Math.ceil(this.total() / this.limit())); }

  /** ---- Public render: filter/sort/paginate and write `rows`/`total` ---- */
  render() {
    const q = (this.q() || '').toLowerCase().trim();
    const role = this.role();

    // filter
    let list = this.all.filter(r => {
      const roleOk = !role || r.role === role;
      const qOk =
        !q ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q));
      return roleOk && qOk;
    });

    // sort
    const field = this.sort();
    const dir = this.dir() === 'asc' ? 1 : -1;
    list = list.sort((a, b) => {
      const av = (this._val(a, field) ?? '').toString().toLowerCase();
      const bv = (this._val(b, field) ?? '').toString().toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return  1 * dir;
      return 0;
    });

    // total (after filtering)
    this.total.set(list.length);

    // paginate
    const start = (this.page() - 1) * this.limit();
    const end = start + this.limit();
    this.rows = list.slice(start, end);
  }

  /** value getter used by sort */
  private _val(r: any, field: string) {
    switch (field) {
      case 'email': return r.email;
      case 'role': return r.role;
      case 'notes': return r.notes;
      case 'createdAt': return r.createdAt || r._id || ''; // fallback if no createdAt
      default: return r[field];
    }
  }

  private _pageCountAfter(total: number) {
    return Math.max(1, Math.ceil(total / this.limit()));
  }
}
