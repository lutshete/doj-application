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
// (Optional future usage)
// import { permissionGuard } from './auth/guards/permission.guard';
// import { roleGuard } from './auth/guards/role.guard';
// import { anyOfGuard } from './auth/guards/any-of.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Public but BLOCKED for logged-in users
  { path: 'login', component: LoginComponent,  },
  { path: 'register', component: RegisterComponent,  },
  { path: 'forgot-password', component: ForgotPasswordComponent,  },
  { path: 'reset-password', component: ResetPasswordComponent,  },

  // Authenticated area
  { path: 'home', component: DefaultComponent, canActivate: [authGuard] },
  { path: 'liquidators', component: LiquidatorsComponent, canActivate: [authGuard] },
  { path: 'track', component: TrackComponent, canActivate: [authGuard] },
  { path: 'review-application/:applicationId', component: ReviewApplicationComponent, canActivate: [authGuard] },
  { path: 'approval-status', component: ApprovalStatusComponent, canActivate: [authGuard] },
  { path: 'meeting-response', component: MeetingResponseComponent, canActivate: [authGuard] },

  // Renewals
  { path: 'renewal', component: AffidavitRenewalComponent, canActivate: [authGuard] },
  {
    path: 'admin/renewals/:id',
    component: AdminRenewalReviewComponent,
    canActivate: [authGuard, adminOfficialOrChiefGuard],
  },

  // Admin panel (Chief or Admin Official)
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard, adminOfficialOrChiefGuard],
  },

  // Fallback
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
