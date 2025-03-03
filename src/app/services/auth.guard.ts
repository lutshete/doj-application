import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = localStorage.getItem('sessionToken');

    // Routes that should NOT be accessed when logged in
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

    if (token) {
      // If logged in and trying to access an auth route, redirect to home
      if (authRoutes.includes(state.url)) {
        return this.router.createUrlTree(['/home']);
      }
      return true; // Allow access to protected routes
    } else {
      // If NOT logged in and trying to access a private route, redirect to login
      if (!authRoutes.includes(state.url)) {
        return this.router.createUrlTree(['/login']);
      }
      return true; // Allow access to auth routes (login, register, etc.)
    }
  }
}
