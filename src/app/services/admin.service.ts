import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin'; // Change this to match your backend URL

  constructor(private http: HttpClient) {}


  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

 
  updateUser(userId: number, updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-user/${userId}`, updates);
  }

  
 

  deActivateUser(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/de-activate-user/${userId}`);
  }

  creaApplicationDates(data): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-application-dates`,data);
  }

  getCurrentApplicationDate(): Observable<any> {
    return this.http.get(`${this.apiUrl}/current-application-date`);
  }

  updateApplicationDates(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-application-dates`, data);
  }

  getPreviousApplicationDates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/previous-application-dates`);
  }
  

  deleteApplicationDate(dateId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/delete-application-date/${dateId}`);
  }

  createMeeting(meetingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-meetings`, meetingData);
  }

  getMeeting(applicationId: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-meetings/${applicationId}`);
  }

  updateMeeting(meetingId: number, meetingData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-meeting/${meetingId}`, meetingData);
  }
  

  getMeetingResponse(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-meeting-response/${token}`);
  }

  // ✅ Respond to Meeting (Accept or Decline)
  respondToMeeting(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/respond-to-meeting`, payload);
  }

  downloadExcel(barcode: string) {
    const body = { excelBarcode: barcode };

    this.http.post(`${this.apiUrl}/geberate-excel`, body, { responseType: 'blob' }).subscribe(
      (blob) => {
        // Convert response into an Excel file
        const file = new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(file, 'ExcelTemplate.xlsx'); // Trigger file download
      },
      (error) => {
        console.error('Error downloading Excel:', error);
      }
    );
  }



 
}
