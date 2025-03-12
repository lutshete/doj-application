import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { TrackingService } from 'src/app/services/tracking.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';
import { WebSocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrl: './track.component.scss'
})
export class TrackComponent {
  currentPeriod: any;
  allApplications: any;
  summary: any;
  searchQuery: string = '';
  statusFilter: string = 'all';
  openingDate: string = '';
  closingDate: string = '';
  provinceFilter: string = 'all';
  provinces: string[] = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 
    'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
  ];
  
  meetingDetails: any = null;
  currentApplicationDate: any;
  shouldShowVenue: boolean = false;
  userData: any;
  attendees: any[] = [];
  isJoined = false;
  loadingAttendees: boolean = false; 
  showAttendees: boolean;
  showAttendeesTooltip: boolean = false;
  tooltipPosition = { top: 0, left: 0 };

  constructor(
    private iconService: IconService,
    private trackingService: TrackingService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService,
    private wsService: WebSocketService,
  ) {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline]);
  }

  ngOnInit() {
    this.userData = this.authService.decodeToken();
    this.getCurrentPeriod();
    this.getAllApplications();
    this.getSummary();
    this.loadCurrentApplicationDate();
  }

  getCurrentPeriod() {
    this.trackingService.getCurrentPeriod().subscribe({
      next: (response) => this.currentPeriod = response,
      error: (error) => this.toastr.error(error.error?.message, 'Error')
    });
  }

  getAllApplications() {
    this.trackingService.getAllApplications().subscribe({
      next: (response) => this.allApplications = response,
      error: (error) => this.toastr.error(error.error?.message, 'Error')
    });
  }

  getSummary() {
    this.trackingService.getSummaryData().subscribe({
      next: (response) => this.summary = response,
      error: (error) => this.toastr.error(error.error?.message, 'Error')
    });
  }

  filterApplications() {
    this.allApplications = [];
    this.cdr.detectChanges();

    const filters = {
      search: this.searchQuery,
      status: this.statusFilter !== 'all' ? this.statusFilter : '',
      openingDate: this.openingDate,
      closingDate: this.closingDate
    };

    this.trackingService.filterApplications(filters).subscribe({
      next: (response) => this.allApplications = response,
      error: (error) => this.toastr.error(error.error?.message, 'Error')
    });
  }

  onFilterChange() {
    this.filterApplications();
  }

  reviewApplication(id: string | number) {
    this.router.navigate([`/review-application/${id}`]);
  }

  joinMeeting() {
    if (!this.meetingDetails || !this.meetingDetails.id || !this.meetingDetails.meetingLink) {
      this.toastr.error("Meeting details are missing or invalid.");
      return;
    }

    const payload = {
      meetingId: this.meetingDetails.id,
      userId: this.userData.userId
    };

    this.adminService.joinMeeting(payload).subscribe({
      next: (response: any) => {
        this.wsService.joinMeeting(this.meetingDetails.id, this.userData.userId);
        this.isJoined = true;
        this.ngOnInit()
        window.open(this.meetingDetails.meetingLink, '_blank'); // Open Teams meeting
        console.log(response.message);
      },
      error: (error) => {
        console.error("Error joining meeting:", error);
        this.toastr.error("Failed to join the meeting. Please try again.");
      }
    });
  }

  leaveMeeting() {
 /*    if (!this.meetingDetails || !this.meetingDetails.id || !this.meetingDetails.meetingLink) {
      this.toastr.error("Meeting details are missing or invalid.");
      return;
    }
 */
    const payload = {
      meetingId: this.meetingDetails.id,
      userId: this.userData.userId
    };

    this.adminService.leaveMeeting(payload).subscribe({
      next: (response: any) => {
        this.wsService.leaveMeeting(this.meetingDetails.id, this.userData.userId);
        this.isJoined = false;
        this.ngOnInit()
      },
      error: (error) => {
        console.error("Error joining meeting:", error);
        this.toastr.error("Failed to join the meeting. Please try again.");
      }
    });
  }

  getMeeting() {
    if (!this.currentApplicationDate?.id) {
      console.warn("No application date available.");
      return;
    }
  
    this.adminService.getMeeting(this.currentApplicationDate.id).subscribe({
      next: (data) => {
        this.meetingDetails = data;
  
        if (!this.meetingDetails) {
          console.warn("No meeting details found.");
          return;
        }
  
        const now = new Date();
        const startDate = new Date(this.meetingDetails.startDate);
        const endDate = new Date(this.meetingDetails.endDate);
  
        // ✅ Show venue if within meeting duration
        this.shouldShowVenue = now >= startDate && now <= endDate;
  
        // ✅ Fetch attendees when meeting details load
        this.getMeetingAttendees(this.meetingDetails.id);
  
        // ✅ Listen for WebSocket updates on attendees
        this.wsService.onMeetingUpdates((data: any) => {
          this.attendees = data.attendees;
          console.log(this.attendees)
          this.cdr.detectChanges(); // Force UI update
        });
  
      },
      error: (error) => {
        console.error("Error fetching meeting details:", error);
        this.toastr.error("Error loading meeting details.");
      }
    });
  }
  

  loadCurrentApplicationDate() {
    this.adminService.getCurrentApplicationDate().subscribe({
      next: (response) => {
        this.currentApplicationDate = response.currentApplicationDate;
        if (this.currentApplicationDate) {
          this.getMeeting();
        }
      },
      error: (error) => {
        console.error("Error fetching current application date:", error);
      }
    });
  }

  getMeetingAttendees(meetingId: string) {
    this.loadingAttendees = true; // Show loading spinner

    this.adminService.getMeetingAttendees(meetingId).subscribe(
      (response: any) => {
        this.attendees = response.attendees || [];
        this.loadingAttendees = false; // Hide loading spinner
      },
      (error) => {
        console.error("Error fetching attendees:", error);
        this.toastr.error("Failed to load attendees.", "Error");
        this.loadingAttendees = false; // Hide loading spinner on error
      }
    );
  }

  showTooltip(element: HTMLElement) {
    if (!this.meetingDetails || !this.meetingDetails.id) {
      this.toastr.error("No meeting details available.");
      return;
    }

    this.getMeetingAttendees(this.meetingDetails.id);
    
    // ✅ Position tooltip to the LEFT of the button
    const rect = element.getBoundingClientRect();
    this.tooltipPosition = { 
      top: rect.top + window.scrollY, 
      left: rect.left + window.scrollX - 220 // Adjust left for correct positioning
    };
    
    this.showAttendeesTooltip = true;
  }


  hideTooltip() {
    this.showAttendeesTooltip = false;
  }

  toggleTooltip() {
    const tooltip = document.getElementById("attendeesTooltip");
    if (tooltip) {
      tooltip.classList.toggle("show");
    }
  }
  
  
  


}
