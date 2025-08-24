import { Routes } from '@angular/router';


export const ADMIN_ROUTES: Routes = [
  {
    path: '',
  //  canActivate: [adminGuard],
    loadComponent: () => import('./admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'users', loadComponent: () => import('./users/users.component').then(m => m.UsersComponent) },
      { path: 'officials', loadComponent: () => import('./officials/preapproved-officials.component').then(m => m.PreapprovedOfficialsComponent) },
      { path: 'windows', loadComponent: () => import('./windows/windows.component').then(m => m.WindowsComponent) },
     /*  { path: 'meetings', loadComponent: () => import('./meetings/meetings.component').then(m => m.MeetingsComponent) }, */
    /*   { path: 'licenses', loadComponent: () => import('./licenses/licenses.component').then(m => m.LicensesComponent) }, */
   /*    { path: 'audit', loadComponent: () => import('./audit/audit.component').then(m => m.AuditComponent) }, */
    ]
  }
];
