import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TrackingService {
  private apiUrl = 'http://localhost:3000/api/tracking'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}


  // 1. Get the current application period
  getCurrentPeriod(): Observable<any> {
    return this.http.get(`${this.apiUrl}/period`);
  }

  // 2. Get summary data for applications
  getSummaryData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/summary`);
  }

  // 3. Get all applications
  getAllApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/applications`);
  }

  // 4. Filter applications based on criteria
  filterApplications(filters: any): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.append('search', filters.search);
    if (filters.status) params = params.append('status', filters.status);
    if (filters.openingDate) params = params.append('openingDate', filters.openingDate);
    if (filters.closingDate) params = params.append('closingDate', filters.closingDate);

    return this.http.get(`${this.apiUrl}/applications/filter`, { params });
  }

  // 5. Get application by user ID
  getApplication(user_id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/application/${user_id}`);
  }

  getApplicationDetails(user_id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/application/${user_id}/details`);
  }

  

}