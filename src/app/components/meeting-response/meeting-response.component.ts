import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';

@Component({
  selector: 'app-meeting-response',
  templateUrl: './meeting-response.component.html',
  styleUrls: ['./meeting-response.component.scss']
})
export class MeetingResponseComponent implements OnInit {
  token: string | null = null;
  action: string | null = null;
  responseMessage: string = '';
  isLoading: boolean = true;
  previousResponse: string | null = null;
  showConfirmation: boolean = false; // ✅ Controls "Yes, Decline" confirmation
  declineReason: boolean;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.action = params['action'];

      if (this.token && (this.action === 'accept' || this.action === 'decline')) {
        this.checkPreviousResponse();
      } else {
        this.responseMessage = '⚠️ Invalid meeting response. Missing or incorrect parameters.';
        this.isLoading = false;
      }
    });
  }

  checkPreviousResponse() {
    this.adminService.getMeetingResponse(this.token).subscribe(
      (response: any) => {
        this.previousResponse = response.acceptanceStatus;
        this.responseMessage = response.message || '';  // ✅ Use message if available
  
        // ✅ If the user has already accepted and wants to decline, show confirmation
        if (response.requireConfirmation) {
          this.showConfirmation = true;
        } else {
          this.sendMeetingResponse(); // ✅ Proceed directly if no confirmation is needed
        }
  
        this.isLoading = false;  // ✅ Stop loading
      },
      (error) => {
        this.responseMessage = '⚠️ Could not verify previous response.';
        this.isLoading = false;
      }
    );
  }
  
  
  
  

  sendMeetingResponse() {
    this.isLoading = true;

    const payload: any = {
      token: this.token, 
      action: this.action
    };

    // ✅ Include declineReason if the user is declining
    if (this.action === 'decline' && this.declineReason) {
      payload.declineReason = this.declineReason;
    }

    this.adminService.respondToMeeting(payload).subscribe(
      (response: any) => {
        this.responseMessage = response.message;
        this.showConfirmation = false; // ✅ Hide confirmation after update
      },
      (error) => {
        this.responseMessage = error.error.message || '❌ Failed to process your response.';
      },
      () => {
        this.isLoading = false;
      }
    );
}


confirmDecline() {
  if (!this.declineReason) return; // Ensure reason is provided

  this.isLoading = true;
  this.adminService.respondToMeeting({
    token: this.token,
    action: 'decline',
    declineReason: this.declineReason
  }).subscribe(
    (response: any) => {
      this.responseMessage = '✅ You have successfully declined the meeting.';
      this.showConfirmation = false;  // Hide confirmation
    },
    (error) => {
      this.responseMessage = error.error.message || '❌ Failed to process your response.';
    },
    () => {
      this.isLoading = false;
    }
  );
}

cancelDecline() {
  this.responseMessage = '✅ Your previous acceptance remains unchanged.';
  this.showConfirmation = false;
}




  goHome() {
    this.router.navigate(['/home']);
  }
}
