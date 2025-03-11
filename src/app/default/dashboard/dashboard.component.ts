import { Component } from '@angular/core';
import Chart from 'chart.js/auto';
import { DashboardService } from 'src/app/services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-default',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DefaultComponent {

  // recentApplications = [
  //   { trackingNo: 'LA-1001', applicantName: 'John Doe', status: 'Approved', statusClass: 'badge-success', submissionDate: 'Feb 28, 2025' },
  //   { trackingNo: 'LA-1002', applicantName: 'Jane Smith', status: 'Rejected', statusClass: 'badge-danger', submissionDate: 'Feb 27, 2025' },
  //   { trackingNo: 'LA-1003', applicantName: 'Robert Brown', status: 'Under Review', statusClass: 'badge-warning', submissionDate: 'Feb 26, 2025' },
  // ];

  reviewerActivity = [
    { reviewerName: 'Alice Johnson', comment: 'Reviewed & Approved', status: 'Approved', statusClass: 'badge-success' },
    { reviewerName: 'Michael Lee', comment: 'Additional documents needed', status: 'Under Review', statusClass: 'badge-warning' },
    { reviewerName: 'Sarah Williams', comment: 'Application rejected due to missing info', status: 'Rejected', statusClass: 'badge-danger' },
  ];
  applicationCount: any[] = [];
  applications: { title: string; value: any; subtext: string; }[];
  recentApplications: any;

  constructor(private dashboardService: DashboardService,private toastr: ToastrService,) {}

  ngOnInit() {
    this.createTrendChart();
    this.getStatusCount();
    this.getApplications();
  }

  createStatusChart(response: any) {
    console.log('createStatusChart',response)
    new Chart('statusChart', {
      type: 'pie',
      options: {
        responsive: true,
        maintainAspectRatio: false,  // Ensure it fills the container
      },
      data: {
        labels: ['Approved', 'Rejected', 'Pending'],
        datasets: [{
          data: [response.Approved, response.Rejected, response.Pending],
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

  createApprovalRateChart(response: any) {
    new Chart('approvalRateChart', {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Rejected'],
        datasets: [{
          data: [response.Approved, response.Rejected],
          backgroundColor: ['#28a745', '#dc3545']
        }]
      }
    });
  }

  getStatusCount() {
    this.dashboardService.getStatusCount().subscribe({
      next: (response) => {
        console.log('total application',response);
        if (response) {
          this.applicationCount = [
            { title: 'Total Applications', value: response.total, subtext: 'All-time submissions' },
            { title: 'Approved', value: response.Approved, subtext: 'Successfully approved' },
            { title: 'Rejected', value: response.Rejected, subtext: 'Declined applications' },
            { title: 'Pending', value: response.Pending, subtext: 'Awaiting review' },
          ];
          this.createStatusChart(response);
          this.createApprovalRateChart(response);
        }
      },
      error: (error) => {
        this.toastr.error(error.error?.message, 'Error');
      },
      complete: () => {}
    });
  }

  getApplications() {
    this.dashboardService.recentApplications().subscribe({
      next: (response) => {
        console.log('applications',response);
        if (response){
          this.recentApplications = response
        }
      },
      error: (error) => {
        this.toastr.error(error.error?.message, 'Error');
      },
      complete: () => {}
    });
  }

  viewApplication(application: any) {
    console.log('Viewing application:', application);
    // Navigate or open modal logic here
  }
}
