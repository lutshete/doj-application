import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { SharedModule } from 'src/shared/shared.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './authentication/login/login.component';
import { ForgotPasswordComponent } from './authentication/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './authentication/reset-password/reset-password.component';
import { AnalyticsChartComponent } from './default/dashboard/analytics-chart/analytics-chart.component';
import { IncomeOverviewChartComponent } from './default/dashboard/income-overview-chart/income-overview-chart.component';
import { MonthlyBarChartComponent } from './default/dashboard/monthly-bar-chart/monthly-bar-chart.component';
import { DefaultComponent } from './default/dashboard/dashboard.component';
import { SalesReportChartComponent } from './default/dashboard/sales-report-chart/sales-report-chart.component';
import { AdminComponent } from "./admin-layout/admin-layout.component";
import { LiquidatorsComponent } from './components/liquidators/liquidators.component';
import { TrackComponent } from './components/track/track.component';
import { ReviewApplicationComponent } from './components/review-application/review-application.component';
import { ApprovalStatusComponent } from './components/approval-status/approval-status.component';
import RegisterComponent from './authentication/register/register.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { MeetingResponseComponent } from './components/meeting-response/meeting-response.component';
import { AffidavitRenewalComponent } from './components/renewal/affidavit-renewal.component';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { AdminRenewalReviewComponent } from './components/admin-renewal/admin-renewal-review.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { PreapprovedOfficialsComponent } from './admin/officials/preapproved-officials.component';
import { WindowsComponent } from './admin/windows/windows.component';
import { MeetingEditorDialog } from './admin/windows/_dialog/meeting-editor.dialog';
import { WindowEditorDialog } from './admin/windows/_dialog/window-editor.dialog';
import { QuorumPanelComponent } from './admin/windows/quorum-panel.component';
import { UsersComponent } from './admin/users/users.component';
import { ApproveDeclineDialog } from './admin/users/_dialog/approve-decline.dialog';
import { UserAuditDrawer } from './admin/users/user-audit.drawer';
import { AdminShellComponent } from './admin/admin-shell.component';
import { LiquidatorReviewComponent } from './components/liquidator-review/liquidator-review.component';
import { TopAlertComponent } from './core/alert/top-alert.component';
import { TopAlertService } from './services/top-alert.service';
import { ToastTrayComponent } from './core/alert/toast-tray.component';
import { ExamInvitesRegisterComponent } from './admin/exam-invites/exam-invites-register.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    DefaultComponent,
    LiquidatorsComponent,
    TrackComponent,
    ReviewApplicationComponent,
    ApprovalStatusComponent,
    RegisterComponent,
    AdminPanelComponent,
    MeetingResponseComponent,
    AffidavitRenewalComponent,
    AdminRenewalReviewComponent,
    DashboardComponent,
    PreapprovedOfficialsComponent,
    WindowsComponent,
    MeetingEditorDialog,
    WindowEditorDialog,
    QuorumPanelComponent,
    UsersComponent,
    ApproveDeclineDialog,
    UserAuditDrawer,
    AdminShellComponent,
    LiquidatorReviewComponent,
    TopAlertComponent, 
    ToastTrayComponent,
    ExamInvitesRegisterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
    AnalyticsChartComponent,
    SalesReportChartComponent,
    AdminComponent,
    
],
  providers: [AuthService,  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true }, TopAlertService],
  bootstrap: [AppComponent]
})
export class AppModule { }
