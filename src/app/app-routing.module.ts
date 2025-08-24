import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './authentication/login/login.component';
import RegisterComponent from './authentication/register/register.component';
import { ForgotPasswordComponent } from './authentication/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { DefaultComponent } from './default/dashboard/dashboard.component';
import { LiquidatorsComponent } from './components/liquidators/liquidators.component';
import { TrackComponent } from './components/track/track.component';
import { ReviewApplicationComponent } from './components/review-application/review-application.component';
import { ApprovalStatusComponent } from './components/approval-status/approval-status.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { MeetingResponseComponent } from './components/meeting-response/meeting-response.component';
import { AffidavitRenewalComponent } from './components/renewal/affidavit-renewal.component';
import { AdminRenewalReviewComponent } from './components/admin-renewal/admin-renewal-review.component';

// ✅ New guard imports (functional guards under auth/guards)
import { authGuard } from './auth/guards/auth.guard';

import { adminOfficialOrChiefGuard } from './auth/guards/admin-official-or-chief.guard';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { UsersComponent } from './admin/users/users.component';
import { PreapprovedOfficialsComponent } from './admin/officials/preapproved-officials.component';
import { WindowsComponent } from './admin/windows/windows.component';
import { AdminShellComponent } from './admin/admin-shell.component';
import { LiquidatorReviewComponent } from './components/liquidator-review/liquidator-review.component';
import { liquidatorGuard } from './auth/guards/liquidator.guard';
import { ExamInvitesRegisterComponent } from './admin/exam-invites/exam-invites-register.component';
// (Optional future usage)
// import { permissionGuard } from './auth/guards/permission.guard';
// import { roleGuard } from './auth/guards/role.guard';
// import { anyOfGuard } from './auth/guards/any-of.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Public but BLOCKED for logged-in users
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Authenticated area
  { path: 'home', component: DefaultComponent, canActivate: [authGuard] },
  {
    path: 'liquidators',
    component: LiquidatorsComponent,
    canActivate: [authGuard, liquidatorGuard],
  },
  { path: 'track', component: TrackComponent, canActivate: [authGuard] },
  {
    path: 'review-application/:applicationId',
    component: ReviewApplicationComponent,
    canActivate: [authGuard],
  },
  {
    path: 'approval-status',
    component: ApprovalStatusComponent,
    canActivate: [authGuard],
  },
  {
    path: 'meeting-response',
    component: MeetingResponseComponent,
    canActivate: [authGuard],
  },
  { path: 'users', component: UsersComponent },
  { path: 'windows', component: WindowsComponent },
  { path: 'officials', component: PreapprovedOfficialsComponent },
{
  path: 'admin',
  canActivate: [authGuard, adminOfficialOrChiefGuard],
  children: [
    { path: '', pathMatch: 'full', component: AdminShellComponent },
    { path: 'users', component: UsersComponent },
    { path: 'officials', component: PreapprovedOfficialsComponent },
    { path: 'windows', component: WindowsComponent },
      {
        path: 'applications-review',
        component: LiquidatorReviewComponent
      },
      {
  path: 'exam-invites',
  component: ExamInvitesRegisterComponent,
  canActivate: [authGuard] // your admin guard (Admin Official or Chief Master)
}

  ]
},


  // Renewals
  {
    path: 'renewal',
    component: AffidavitRenewalComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin/renewals/:id',
    component: AdminRenewalReviewComponent,
    canActivate: [authGuard, adminOfficialOrChiefGuard],
  },

  // Admin panel (Chief or Admin Official)
 /*  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard, adminOfficialOrChiefGuard],
  },
 */
    
  // Fallback
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
