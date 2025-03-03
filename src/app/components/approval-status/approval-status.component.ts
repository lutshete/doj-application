import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-approval-status', 
  templateUrl: './approval-status.component.html',
  styleUrl: './approval-status.component.scss'
})
export class ApprovalStatusComponent {
  statusMessage: string = '';
  userId: string | null = null;
  action: string | null = null;


  constructor(private route: ActivatedRoute, private authService:AuthService, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'];
      this.action = params['action']; // Get the action from the query parameters
  
      if (this.action === 'approveUser') {
          this.approveUser(this.userId);
          this.statusMessage = 'User approved successfully!';
      } else if (this.action === 'declineUser') {
          this.declineUser(this.userId);
          this.statusMessage = 'User decline notification sent.';
      } else {
          this.statusMessage = 'Invalid action.';
      }
  });
  
  }

  approveUser(userId: string | null) {
    if (userId) {
      this.authService.approveUser(userId).subscribe(
        response => {
          this.statusMessage = response.message;
        },
        error => {
          this.statusMessage = 'Error approving user.';
        }
      );
    }
  }

  declineUser(userId: string | null) {
    if (userId) {
      this.authService.declineUser(userId).subscribe(
        response => {
          this.statusMessage = response.message;
        },
        error => {
          this.statusMessage = 'Error declining user.';
        }
      );
    }
  }

  goToLogin() {
    this.router.navigate(['/login']); // Redirects to login page
  }

  closeApp() {
    window.close(); // Attempts to close the application or browser tab
  }
}
