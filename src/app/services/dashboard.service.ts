import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/api/dashboard'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}

  getStatusCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applicationCount`);
  }

  recentApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications`);
  }

}