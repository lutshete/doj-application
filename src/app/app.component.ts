import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'doj-liquidators-app';
  hideAdminLayout: boolean = false; // Flag to hide <app-admin>
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Define routes where <app-admin> should be hidden
        const noAdminRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/approval-status', '/meeting-response'];

        // Extract base path (ignores query parameters)
        const basePath = event.url.split('?')[0];

        // Hide <app-admin> if the current route is in noAdminRoutes
        this.hideAdminLayout = noAdminRoutes.includes(basePath);
      }
    });
  }
}
