import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LiquidatorApplicationService {
  private apiUrl = 'http://localhost:3000/api/liquidator'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}

  // Create a new application
  createApplication(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/application`, { user_id: userId });
  }

  // Get application by ID
  getApplication(user_id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/application/${user_id}`);
  }

  // Update a specific section in the application
  updateSection(applicationId: number, section: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/application-no-attachment/${applicationId}/section`, { section, data });
  }

  updateSection2(applicationId: number, section: number, formData: FormData): Observable<any> {
    // Append the section number as a field in FormData
    formData.append('section', section.toString());
  
    // Send FormData directly as the body of the request
    return this.http.put(`${this.apiUrl}/application/${applicationId}/section`, formData);
  }

  // Submit the application
  submitApplication(applicationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/application/${applicationId}/submit`, {});
  }

  // Check application review status
  getReviewStatus(applicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/application/${applicationId}/status`);
  }

  getSectionDetails(applicationId: number, section: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/application/${applicationId}/section/${section}`);
  }

  editSection2(personalInfoId: number, section: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/application-no-attachment/${personalInfoId}/edit-section`, {
      section,
      data,
    });
  }

  editSection(personalInfoId: number, section: number, formData: FormData): Observable<any> {
 
    formData.append('section', section.toString());

    return this.http.put(`${this.apiUrl}/application/${personalInfoId}/edit-section`, formData);
  }
  

  updateApplicationStatus(application_id: number, statusData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/application/status/${application_id}`, statusData);
  }
  
  
  addTradingPartners(applicationId: number, tradingPartners: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/tradingpartners`, {
      application_id: applicationId,
      trading_partners: tradingPartners,
    });
  }

  getTradingPartners(applicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tradingpartners/${applicationId}`);
  }

  updateTradingPartners(applicationId: number, tradingPartners: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/tradingpartners/${applicationId}`, {
      trading_partners: tradingPartners,
    });
  }

  submitDeclarationForm(applicationId: number, applicationStatus: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit-declaration-form/${applicationId}`, applicationStatus);
  }

  getApplicationStatus(applicationId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/application-status/${applicationId}`);
  }
  
  updateDeclarationForm(applicationId: number, statusData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-application-status/${applicationId}`, statusData);
  }


}
