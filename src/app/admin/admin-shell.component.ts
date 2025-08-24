import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

// Services that already exist in your app
import { UsersService } from '../services/users.service';
import { WindowsService } from '../services/windows.service';

type Role = 'LIQUIDATOR'|'OFFICIAL'|'CHIEF_MASTER';

@Component({
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss']
})
export class AdminShellComponent implements OnInit {
  private router = inject(Router);
  private usersSvc = inject(UsersService);
  private windowsSvc = inject(WindowsService);

  me: { firstName?: string; lastName?: string; email?: string; role?: Role; officialFlags?: { isAdminOfficial?: boolean } } | null = null;

  // KPIs
  loading = true;
  stats = {
    totalUsers: 0,
    officialsPending: 0,
    liquidators: 0,
    chiefs: 0,
    adminOfficials: 0,
  };

  // Current/next application window (if any)
  currentWindow: { openingDate: string; closingDate: string } | null = null;

  ngOnInit() {
    try { this.me = JSON.parse(localStorage.getItem('me') || 'null'); } catch { this.me = null; }
    this.fetchData();
  }

  private fetchData() {
    this.loading = true;

    this.usersSvc.list({ page: 1, limit: 1000 }).subscribe((res: any) => {
      const items = res.items || [];
      this.stats.totalUsers = res.total ?? items.length;
      this.stats.officialsPending = items.filter((u: any) => u.role === 'OFFICIAL' && u.approval?.status === 'PENDING').length;
      this.stats.liquidators = items.filter((u: any) => u.role === 'LIQUIDATOR').length;
      this.stats.chiefs = items.filter((u: any) => u.role === 'CHIEF_MASTER').length;
      this.stats.adminOfficials = items.filter((u: any) => u.role === 'OFFICIAL' && u.officialFlags?.isAdminOfficial).length;
      this.loading = false;
    }, _ => this.loading = false);

    this.windowsSvc.list().subscribe((ws: any[]) => {
      if (!Array.isArray(ws) || ws.length === 0) { this.currentWindow = null; return; }
      // Choose the window that is currently open, or most recent
      const now = new Date();
      const open = ws.find(w => new Date(w.openingDate) <= now && now <= new Date(w.closingDate));
      this.currentWindow = open || ws.sort((a,b)=>+new Date(b.openingDate)-+new Date(a.openingDate))[0];
    });
  }

  roleBadge(): string {
    const r = this.me?.role;
    if (r === 'CHIEF_MASTER') return 'Chief Master';
    if (r === 'OFFICIAL') return this.me?.officialFlags?.isAdminOfficial ? 'Admin Official' : 'Official';
    return 'Liquidator';
    }

  canAdmin(): boolean {
    return this.me?.role === 'CHIEF_MASTER' || (this.me?.role === 'OFFICIAL' && !!this.me?.officialFlags?.isAdminOfficial);
  }

  go(path: string) { this.router.navigateByUrl(path); }
}
