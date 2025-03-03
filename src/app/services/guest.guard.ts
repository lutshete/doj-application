import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class GuestGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      // Redirect logged-in users to the dashboard
      return this.router.createUrlTree(['/dashboard/default']);
    }
    return true;
  }
}
