import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, NgIf, NgFor, DatePipe } from '@angular/common';
import { UsersService } from '../../services/users.service';
import { WindowsService } from '../../services/windows.service';
import { LicensesService } from '../../services/licenses.service';
import { RouterLink } from '@angular/router';

@Component({ 
  selector: 'app-dashboard',  
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private usersSvc = inject(UsersService);
  private windowsSvc = inject(WindowsService);
  private licSvc = inject(LicensesService);

  stats = {
    totalUsers: 0,
    officialsPending: 0,
    liquidators: 0,
    chiefs: 0,
    adminOfficials: 0,
    activeLicenses: 0,
    pendingLicenses: 0
  };
  windows: any[] = [];

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.usersSvc.list({ page:1, limit:1_000 }).subscribe(res=>{
      const items = res.items;
      this.stats.totalUsers = res.total;
      this.stats.officialsPending = items.filter(u=>u.role==='OFFICIAL' && u.approval?.status==='PENDING').length;
      this.stats.liquidators = items.filter(u=>u.role==='LIQUIDATOR').length;
      this.stats.chiefs = items.filter(u=>u.role==='CHIEF_MASTER').length;
      this.stats.adminOfficials = items.filter(u=>u.role==='OFFICIAL' && u.officialFlags?.isAdminOfficial).length;
    });

    this.licSvc.list({ page:1, limit:1, status:'ACTIVE' }).subscribe(r=>this.stats.activeLicenses = r.total);
    this.licSvc.list({ page:1, limit:1, status:'PENDING_ACTIVATION' }).subscribe(r=>this.stats.pendingLicenses = r.total);
    this.windowsSvc.list().subscribe(ws => this.windows = ws);
  }
}
