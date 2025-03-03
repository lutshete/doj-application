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
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home', // Redirect empty path to /home
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: DefaultComponent,
    canActivate: [AuthGuard], // Protect Home Route
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard], // Uses AuthGuard to block logged-in users
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard], // Uses AuthGuard to block logged-in users
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [AuthGuard], // Uses AuthGuard to block logged-in users
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [AuthGuard], // Uses AuthGuard to block logged-in users
  },
  {
    path: 'liquidators',
    component: LiquidatorsComponent,
    canActivate: [AuthGuard], // Protected route
  },
  {
    path: 'track',
    component: TrackComponent,
    canActivate: [AuthGuard], // Protected route
  },
  {
    path: 'review-application/:applicationId',
    component: ReviewApplicationComponent,
    canActivate: [AuthGuard], // Protected route
  },
  {
    path: 'approval-status',
    component: ApprovalStatusComponent,
    canActivate: [AuthGuard], // Protected route
  },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
