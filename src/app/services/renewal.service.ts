import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type FileKind = 'tax_personal' | 'tax_business' | 'bond' | 'bank' | 'affidavit';

export interface RenewalHeader {
  renewal_id: number;
  user_id: number;
  application_id: number | null;
  application_dates_id: number;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  last_saved_at: string;
  declaration_agreed: 0 | 1;
  ack_change_notice: 0 | 1;
  ack_punitive_notice: 0 | 1;
  annexA_personal: 0 | 1;
  annexB_business: 0 | 1;
  annexC_bond: 0 | 1;
  disqualification_note?: string | null;
  current_year_activities?: string | null;
  will_inform_if_unavailable?: 0 | 1;
  relationship_relation?: 'not_related' | 'related' | null;
  relationship_details?: string | null;
}

export interface RenewalPersonal {
  full_name?: string | null;
  identity_number?: string | null;
}

export interface RenewalBusiness {
  business_details_change: 'unchanged' | 'changed';
  business_change_details?: string | null;
  main_business_physical?: string | null;
}

export interface RenewalOfficeRow {
  id?: number;
  city: string;
  taking_appointments: 0 | 1 | boolean;
  physical_address?: string | null;
  postal_address?: string | null;
  telephone?: string | null;
}

export interface InsurerLetterRow {
  id: number;
  file_name: string;
  uploaded_at: string;
}

export interface MembershipRow {
  id: number;
  organisation: string;
  in_good_standing: 0 | 1;
  certificate_name?: string | null;
  uploaded_at: string;
}

export interface RenewalDocumentsLite {
  has_tax_personal: 0 | 1;
  tax_clearance_personal_name?: string | null;
  has_tax_business: 0 | 1;
  tax_clearance_business_name?: string | null;
  has_bond: 0 | 1;
  bond_facility_name?: string | null;
  has_bank: 0 | 1;
  bank_account_proof_name?: string | null;
  has_affidavit: 0 | 1;
  affidavit_file_name?: string | null;
}

export interface RenewalStatusRow {
  status_id: number;
  renewal_id: number;
  review_status: 'Draft'|'Submitted'|'Under Review'|'Approved'|'Rejected';
  outcome: 'Pending'|'Approved'|'Rejected';
  updated_at: string;
  reviewer_id?: number | null;
  further_comments?: string | null;
}

export interface RenewalSnapshot {
  renewal: RenewalHeader | null;
  personal: RenewalPersonal | null;
  business: RenewalBusiness | null;
  offices: RenewalOfficeRow[];
  insurerLetters: InsurerLetterRow[];
  memberships: MembershipRow[];
  documents: RenewalDocumentsLite | null;
  status: RenewalStatusRow | null;
}

export interface AdminListQuery {
  cycleId?: number | string;
  status?: string;
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface AdminReviewPayload {
  review_status?: 'Under Review'|'Approved'|'Rejected'|'Submitted';
  outcome?: 'Pending'|'Approved'|'Rejected';
  further_comments?: string;
  annexA_comment?: string;
  annexB_comment?: string;
  annexC_comment?: string;
  reviewer_id?: number;
}

@Injectable({ providedIn: 'root' })
export class RenewalService {
  private base = ('http://localhost:3000') + '/api';

  constructor(private http: HttpClient) {}

  // If you already use an auth interceptor, you can delete this method & header usage.


  // ----------------- Applicant -----------------

  /** Start (or fetch) my renewal for current cycle */
  start(): Observable<RenewalSnapshot> {
    return this.http.post<RenewalSnapshot>(`${this.base}/renewals/start`, {}, );
  }

  /** Get my renewal for current cycle */
  getCurrent(): Observable<RenewalSnapshot> {
    return this.http.get<RenewalSnapshot>(`${this.base}/renewals/current`, );
  }

  savePersonal(renewalId: number, body: { fullName?: string; identityNumber?: string; }): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/renewals/${renewalId}/personal`, body, );
  }

  saveBusiness(renewalId: number, body: {
    businessDetailsChange: 'unchanged'|'changed';
    businessChangeDetails?: string | null;
    mainBusinessPhysical?: string | null;
  }): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/renewals/${renewalId}/business`, body, );
  }

  saveOffices(renewalId: number, offices: Array<{
    city: string;
    takingAppointments: boolean;
    physicalAddress?: string | null;
    postalAddress?: string | null;
    telephone?: string | null;
  }>): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/renewals/${renewalId}/offices`, { offices }, );
  }

  saveActivitiesAndRelationship(renewalId: number, body: {
    disqualificationNote?: string | null;
    currentYearActivities?: string | null;
    willInformIfUnavailable?: boolean;
    relation?: 'not_related'|'related';
    relationDetails?: string | null;
  }): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/renewals/${renewalId}/activities-relationship`, body, );
  }

  saveTerms(renewalId: number, body: {
    ackChangeNotice: boolean;
    ackPunitiveNotice: boolean;
    annexA: boolean;
    annexB: boolean;
    annexC: boolean;
    declaration: boolean;
  }): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/renewals/${renewalId}/terms`, body, );
  }

  addInsurerLetter(renewalId: number, file: File): Observable<{id: number; file_name: string}> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{id: number; file_name: string}>(`${this.base}/renewals/${renewalId}/insurer-letters`, fd, );
  }

  removeInsurerLetter(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.base}/renewals/insurer-letters/${id}`, );
  }

  addMembership(renewalId: number, organisation: string, inGoodStanding: boolean, certificate?: File): Observable<{id: number}> {
    const fd = new FormData();
    fd.append('organisation', organisation);
    fd.append('inGoodStanding', inGoodStanding ? '1' : '0');
    if (certificate) fd.append('certificate', certificate);
    return this.http.post<{id: number}>(`${this.base}/renewals/${renewalId}/memberships`, fd, );
  }

  removeMembership(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.base}/renewals/memberships/${id}`, );
  }

  /** Upload any subset of documents (only provided files will be updated). */
  uploadDocuments(renewalId: number, files: {
    taxClearancePersonal?: File;
    taxClearanceBusiness?: File;
    bondFacility?: File;
    bankAccountProof?: File;
    affidavitFile?: File;
  }): Observable<{message: string}> {
    const fd = new FormData();
    if (files.taxClearancePersonal) fd.append('taxClearancePersonal', files.taxClearancePersonal);
    if (files.taxClearanceBusiness) fd.append('taxClearanceBusiness', files.taxClearanceBusiness);
    if (files.bondFacility) fd.append('bondFacility', files.bondFacility);
    if (files.bankAccountProof) fd.append('bankAccountProof', files.bankAccountProof);
    if (files.affidavitFile) fd.append('affidavitFile', files.affidavitFile);
    return this.http.post<{message: string}>(`${this.base}/renewals/${renewalId}/documents`, fd, );
  }

  /** Download a specific binary file as Blob (you can createObjectURL in the component). */
  downloadFile(renewalId: number, kind: FileKind): Observable<Blob> {
    return this.http.get(`${this.base}/renewals/${renewalId}/files/${kind}`, {
      
      responseType: 'blob',
    });
  }

  submit(renewalId: number): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/renewals/${renewalId}/submit`, {}, );
  }

  // ----------------- Admin -----------------

  adminListRenewals(params: AdminListQuery = {}): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params.cycleId != null) httpParams = httpParams.set('cycleId', String(params.cycleId));
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);

    return this.http.get<any[]>(`${this.base}/admin/renewals`, {  params: httpParams });
  }

  adminGetRenewal(renewalId: number): Observable<RenewalSnapshot> {
    return this.http.get<RenewalSnapshot>(`${this.base}/admin/renewals/${renewalId}`, );
  }

  adminReviewRenewal(renewalId: number, payload: AdminReviewPayload): Observable<{message: string}> {
    return this.http.put<{message: string}>(`${this.base}/admin/renewals/${renewalId}/review`, payload, );
  }

  // ----------------- Helpers -----------------

  /** Utility to make a blob URL (remember to revoke it in your component). */
  blobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  adminDownloadInsurerLetter(id: number) {
  return this.http.get(`${this.base}/admin/renewals/insurer-letters/${id}/download`, {

    responseType: 'blob'
  });
}

adminDownloadMembership(id: number) {
  return this.http.get(`${this.base}/admin/renewals/memberships/${id}/download`, {
  
    responseType: 'blob'
  });
}

}
