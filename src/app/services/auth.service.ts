import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // Change this to match your backend URL

  constructor(private http: HttpClient) {}

  register(data:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  verifyOtp(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, data);
  }

  resendOtp(email): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-otp`, email);
  }

    // Method to approve a user
    approveUser(userId: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/approve-user`, {
        params: { userId }
      });
    }
  
    // Method to decline a user
    declineUser(userId: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/decline-user`, {
        params: { userId }
      });
    }

    login(data:any): Observable<any> {
      return this.http.post(`${this.apiUrl}/login`, data);
    }


    decodeToken(): any {
      const sessionToken = localStorage.getItem('sessionToken');
  
      if (!sessionToken) {
        console.warn('No session token found.');
        return null;
      }
  
      try {
        const decodedToken: any = jwtDecode(sessionToken);
  
        // ✅ Check if Token is Expired
        if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
          console.warn('Session token has expired.');
          localStorage.removeItem('sessionToken'); // ✅ Remove expired token
          return null;
        }
  
        return decodedToken;
  
      } catch (error) {
        console.error('Token decoding failed:', error);
        return null;
      }
    }

    // Forgot Password Request
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  // Reset Password
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  verifyResetToken(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-reset-token`, { token });
  }
  
    
}
