import { Component } from '@angular/core';
import Chart from 'chart.js/auto';
import { AttendeeService, DashboardService, MeetingService, NotificationService } from 'src/app/services';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-default',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DefaultComponent {
isLoading: any;
selectedAttendees: any[] = [];
filterForm: FormGroup;
  attendee_lists: any;
  filteredAttendees: any;

applyFilter() {
throw new Error('Method not implemented.');
}

  reviewerActivity = [
    { reviewerName: 'Alice Johnson', comment: 'Reviewed & Approved', status: 'Approved', statusClass: 'badge-success' },
    { reviewerName: 'Michael Lee', comment: 'Additional documents needed', status: 'Under Review', statusClass: 'badge-warning' },
    { reviewerName: 'Sarah Williams', comment: 'Application rejected due to missing info', status: 'Rejected', statusClass: 'badge-danger' },
  ];
  applicationCount: any[] = [];
  applications: { title: string; value: any; subtext: string; }[];
  recentApplications: any;
  meetings: any;
  isPanelOpen = false;
  isPanelOpenData
statusFilter: any;
  constructor(private fb: FormBuilder,private dashboardService: DashboardService,private toastr: ToastrService, private meetingService: MeetingService, private attendeeService:AttendeeService, private notificationService : NotificationService) {
    this.filterForm = this.fb.group({
    quorum: ['']
  });
}

  ngOnInit() {
    this.createTrendChart();
    this.getStatusCount();
    this.getApplications();
    this.getMeetings();
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

  getMeetings() {
    this.meetingService.getMeetings().subscribe({
      next: (response) => {
        if (response){
          this.meetings = response
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

  getCardColor(index: number): string {
    const colors = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning'];
    return colors[index % colors.length] + ' text-white';
  }

  openPopUp(meeting: any) {
    this.attendeeService.getMeetingAttendees(meeting.id).subscribe({
      next: (response: any) => {
        this.attendee_lists = response;
        this.filteredAttendees = this.attendee_lists;
        this.selectedAttendees = response;
        if (response) {
          this.isPanelOpenData = { meeting_id: meeting.id, attendees: response };
          this.isPanelOpen = true;
        }
      },
      error: (error: any) => this.toastr.error('Error fetching attendee quorum', 'Error'),
    });
  }

  close() {
    this.isPanelOpen = false;    // Close the panel
  }

  // Filter Logic
  applyFilters(): void {
    const {quorum } = this.filterForm.value;

    this.filteredAttendees = this.attendee_lists.filter(attendee => {

      const quorumMatch = !quorum || attendee.quorum_status === quorum;

      return quorumMatch;
    });
  }

  sendEmail(): void {
    if (!this.selectedAttendees || !Array.isArray(this.selectedAttendees)) {
      this.notificationService.showError('No attendees selected.', 'Error');
      return;
    }

    const selectedAttendees = this.selectedAttendees.filter(attendee => attendee.acceptanceStatus === 'Pending');

    if (selectedAttendees.length === 0) {
      this.notificationService.showWarning('No pending attendees to notify.', 'Warning');
      return;
    }

    const payload = { users: selectedAttendees };
    this.isLoading = true; // Start loading state

    this.attendeeService.attendeeReminder(payload).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(response.message || 'Reminders sent successfully.', 'Success');
      },
      error: (error) => {
        console.error('❌ Error:', error);
        this.notificationService.showError('An error occurred while sending reminders.', 'Error');
      },
      complete: () => {
        this.isLoading = false; // Stop loading state after completion
      }
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.filteredAttendees = this.attendee_lists;
  }

}
