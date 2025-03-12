import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MeetingService {
  private apiUrl = 'http://localhost:3000/api/meeting'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}

  getMeetings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/meetings`);
  }

}