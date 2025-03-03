// angular import
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import

import { MonthlyBarChartComponent } from './monthly-bar-chart/monthly-bar-chart.component';
import { IncomeOverviewChartComponent } from './income-overview-chart/income-overview-chart.component';
import { AnalyticsChartComponent } from './analytics-chart/analytics-chart.component';
import { SalesReportChartComponent } from './sales-report-chart/sales-report-chart.component';

// icons
import { IconService } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-default',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DefaultComponent {
  applicationMetrics = [
    { title: 'Total Applications', value: 120, subtext: 'All-time submissions' },
    { title: 'Approved', value: 85, subtext: 'Successfully approved' },
    { title: 'Rejected', value: 25, subtext: 'Declined applications' },
    { title: 'Pending', value: 10, subtext: 'Awaiting review' },
  ];

  recentApplications = [
    { trackingNo: 'LA-1001', applicantName: 'John Doe', status: 'Approved', statusClass: 'badge-success', submissionDate: 'Feb 28, 2025' },
    { trackingNo: 'LA-1002', applicantName: 'Jane Smith', status: 'Rejected', statusClass: 'badge-danger', submissionDate: 'Feb 27, 2025' },
    { trackingNo: 'LA-1003', applicantName: 'Robert Brown', status: 'Under Review', statusClass: 'badge-warning', submissionDate: 'Feb 26, 2025' },
  ];

  reviewerActivity = [
    { reviewerName: 'Alice Johnson', comment: 'Reviewed & Approved', status: 'Approved', statusClass: 'badge-success' },
    { reviewerName: 'Michael Lee', comment: 'Additional documents needed', status: 'Under Review', statusClass: 'badge-warning' },
    { reviewerName: 'Sarah Williams', comment: 'Application rejected due to missing info', status: 'Rejected', statusClass: 'badge-danger' },
  ];

  constructor() {}

  ngOnInit() {
    this.createStatusChart();
    this.createTrendChart();
    this.createApprovalRateChart();
  }

  createStatusChart() {
    new Chart('statusChart', {
      type: 'pie',
      options: {
        responsive: true,
        maintainAspectRatio: false,  // Ensure it fills the container
      },
      data: {
        labels: ['Approved', 'Rejected', 'Pending', 'Under Review'],
        datasets: [{
          data: [85, 25, 10, 15],
          backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#007bff']
        }]
      }
    });
  }
  
  createTrendChart() {
    new Chart('trendChart', {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: false,  // Ensure it fills the container
      },
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Applications Submitted',
          data: [20, 25, 30, 40, 50],
          borderColor: '#007bff',
          fill: false
        }]
      }
    });
  }
  

  createApprovalRateChart() {
    new Chart('approvalRateChart', {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Rejected'],
        datasets: [{
          data: [85, 25],
          backgroundColor: ['#28a745', '#dc3545']
        }]
      }
    });
  }
}
