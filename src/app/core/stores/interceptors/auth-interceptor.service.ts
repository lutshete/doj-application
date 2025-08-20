// core/interceptors/auth-interceptor.service.ts
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Optional opt-out per request: add header 'X-Skip-Auth': 'true'
    if (req.headers.has('X-Skip-Auth')) {
      return next.handle(req.clone({ headers: req.headers.delete('X-Skip-Auth') }));
    }

    const token = localStorage.getItem('sessionToken');

    const authReq = token && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError(err => {
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('sessionToken');
          this.router.navigateByUrl('/login');
        }
        return throwError(() => err);
      })
    );
  }
}
