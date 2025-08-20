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
    AdminRenewalReviewComponent
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
    AdminComponent
],
  providers: [AuthService,  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },],
  bootstrap: [AppComponent]
})
export class AppModule { }
