import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Optional: if you want toast messages, uncomment and inject
// import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class AuthInterceptorService implements HttpInterceptor {
  constructor(
    private router: Router,
    // private toast: ToastrService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Allow opt-out per request
    if (req.headers.has('X-Skip-Auth')) {
      const headers = req.headers.delete('X-Skip-Auth');
      return next.handle(req.clone({ headers }));
    }

    const token = localStorage.getItem('sessionToken');

    // Only add header if we have a token and the request didn't already set it
    const authReq = token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // Network / CORS
        if (err.status === 0) {
          // this.toast?.error('Network error. Please check your connection.');
          return throwError(() => err);
        }

        // Too many attempts (e.g., OTP, login rate limit)
        if (err.status === 429) {
          // this.toast?.warning(err.error?.message || 'Too many attempts. Please try again later.');
          return throwError(() => err);
        }

        // Account locked (backend uses 423)
        if (err.status === 423) {
          // this.toast?.error(err.error?.message || 'Account locked temporarily.');
          return throwError(() => err);
        }

        // Auth failures: clear token and redirect
        if (err.status === 401 || err.status === 403) {
          // Centralized logout
          try { localStorage.removeItem('sessionToken'); } catch {}
          // Optional: preserve where the user was headed
          const returnUrl = encodeURIComponent(this.router.url || '/');
          // this.toast?.info('Your session has expired. Please sign in again.');
          this.router.navigateByUrl(`/login?returnUrl=${returnUrl}`);
        }

        return throwError(() => err);
      })
    );
  }
}

/** Provide in NgModule apps:
 *
 * providers: [
 *   { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },
 * ]
 *
 * Or in standalone bootstrap (Angular 15+):
 *
 * import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideHttpClient(withInterceptorsFromDi()),
 *     { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true },
 *   ],
 * });
 */
