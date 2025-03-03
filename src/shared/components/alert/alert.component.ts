import { Component, Input } from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent {
  @Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info'; // Default to 'info'
  @Input() message: string = ''; // Default empty message
  visible: boolean = false; // Controls visibility of the alert

  show() {
    this.visible = true; // Show the alert
    setTimeout(() => this.close(), 3000); // Automatically close after 3 seconds
  }

  close() {
    this.visible = false; // Hide the alert
  }
}
