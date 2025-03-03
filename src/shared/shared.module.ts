// Angular Imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// project import

import { SpinnerComponent } from './components/spinner/spinner.component';
import { CardComponent } from './components/card/card.component';
import { MatDialogModule } from '@angular/material/dialog';

// third party
import { NgScrollbarModule } from 'ngx-scrollbar';
import { IconModule } from '@ant-design/icons-angular';

// bootstrap import
import { NgbDropdownModule, NgbNavModule, NgbModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { ApprovalStatusComponent } from '../app/components/approval-status/approval-status.component';
import { SnotifyModule, SnotifyService, ToastDefaults } from 'ng-snotify';
import { ToastrModule, provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AnalyticsChartComponent } from 'src/app/default/dashboard/analytics-chart/analytics-chart.component';
import { IncomeOverviewChartComponent } from 'src/app/default/dashboard/income-overview-chart/income-overview-chart.component';
import { MonthlyBarChartComponent } from 'src/app/default/dashboard/monthly-bar-chart/monthly-bar-chart.component';
import { SalesReportChartComponent } from 'src/app/default/dashboard/sales-report-chart/sales-report-chart.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  //  NgApexchartsModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbModule,
    NgbCollapseModule,
    NgScrollbarModule,
    CardComponent,
    IconModule,
    MatDialogModule,
   

/*     MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
    AnalyticsChartComponent,
    SalesReportChartComponent, */
   // SnotifyModule,
    ToastrModule.forRoot({
      timeOut: 10000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    })
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  //  NgApexchartsModule,
   // SpinnerComponent,
    NgbModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbCollapseModule,
    NgScrollbarModule,
    CardComponent,
    IconModule,
  
  
   /*  MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
    AnalyticsChartComponent,
    SalesReportChartComponent */
  ],
  declarations: [SpinnerComponent],
  providers: [
    provideAnimations(),

    provideToastr({
      timeOut: 10000,
      closeButton: true,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true
    }),
    { provide: 'SnotifyToastConfig', useValue: ToastDefaults},
  //  SnotifyService
  ]
})
export class SharedModule {}
