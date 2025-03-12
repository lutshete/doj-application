import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AttendeeService {
  private apiUrl = 'http://localhost:3000/api/attendees'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}

  getMeetingAttendees(meeting_id:number): Observable<any> {
    return this.http.get(`${this.apiUrl}/meeting-attendees/${meeting_id}`);
  }

  attendeeReminder(data: any): Observable<any> {
    if (!data || !data.users || data.users.length === 0) {
      console.error('❌ No attendees provided for the reminder.');
      return throwError(() => new Error('No attendees to send reminders to.'));
    }

    return this.http.post(`${this.apiUrl}/attendees-reminder`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    }).pipe(
      catchError(error => {
        console.error('❌ Error sending attendee reminders:', error);
        return throwError(() => error);
      })
    );
  }


}