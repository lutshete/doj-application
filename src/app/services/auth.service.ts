import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // keep your import style

/***** RBAC enums & alias map (mirror backend) *****/
export enum ROLES {
  LIQUIDATOR = 'LIQUIDATOR',
  OFFICIAL = 'OFFICIAL',
  CHIEF_MASTER = 'CHIEF_MASTER',
}
export enum PERMISSIONS {
  APPLICATION_REVIEW = 'APPLICATION_REVIEW',
  MEETING_MANAGE = 'MEETING_MANAGE',
  WINDOW_CREATE = 'WINDOW_CREATE',
  WINDOW_UPDATE = 'WINDOW_UPDATE',
  WINDOW_DELETE = 'WINDOW_DELETE',
  USER_DISABLE_LIQUIDATOR = 'USER_DISABLE_LIQUIDATOR',
  USER_UPDATE_ROLE = 'USER_UPDATE_ROLE',
  USERS_DEACTIVATE = 'USERS_DEACTIVATE',
  USERS_ACTIVATE = 'USERS_ACTIVATE',
}
const PERM_ALIASES: Record<string, PERMISSIONS> = {
  // Applications
  'applications:list': PERMISSIONS.APPLICATION_REVIEW,
  'applications:read': PERMISSIONS.APPLICATION_REVIEW,
  'applications:write': PERMISSIONS.APPLICATION_REVIEW,
  'applications:review': PERMISSIONS.APPLICATION_REVIEW,
  // Approvals (extra chief/adminOfficial gate is handled in can())
  'applications:approve': PERMISSIONS.APPLICATION_REVIEW,
  'applications:reject': PERMISSIONS.APPLICATION_REVIEW,
  // Meetings
  'meetings:manage': PERMISSIONS.MEETING_MANAGE,
  // Windows
  'windows:create': PERMISSIONS.WINDOW_CREATE,
  'windows:update': PERMISSIONS.WINDOW_UPDATE,
  'windows:delete': PERMISSIONS.WINDOW_DELETE,
  // Users
  'users:disable-liquidator': PERMISSIONS.USER_DISABLE_LIQUIDATOR,
  'users:update-role': PERMISSIONS.USER_UPDATE_ROLE,
  // If you gate these via policy too:
  'users:deactivate': PERMISSIONS.USERS_DEACTIVATE,
  'users:activate': PERMISSIONS.USERS_ACTIVATE,
};

type PermOrAlias = PERMISSIONS | keyof typeof PERM_ALIASES;

export interface OfficialFlags {
  isAdminOfficial?: boolean;
  [k: string]: any;
}

export interface JwtUser {
  id: string;
  email: string;
  role: ROLES | string;
  firstName?: string;
  lastName?: string;
  officialFlags?: OfficialFlags;
  // add more if your JWT contains them
}

const TOKEN_KEY = 'sessionToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // If you mount routes under /api, and userRoutes prefixes /auth, keep this:
  private apiUrl = 'http://localhost:3000/api/auth';
  private usersUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {
    // Initialize state from existing token
    const token = localStorage.getItem(TOKEN_KEY);
    this._token$.next(token);
    this._user$.next(this.decodeUser(token));
  }

  /*************** State (token + user) ***************/
  private _token$ = new BehaviorSubject<string | null>(null);
  token$ = this._token$.asObservable();

  private _user$ = new BehaviorSubject<JwtUser | null>(null);
  user$ = this._user$.asObservable();

  get token() { return this._token$.value; }
  get user() { return this._user$.value; }
  get isLoggedIn$() { return this.user$.pipe(map(Boolean)); }

  /** Save/remove token and derive user */
  setSessionToken(token: string | null) {
    console.log(token)
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    this._token$.next(token);
    this._user$.next(this.decodeUser(token));
  }

  /** Optional convenience */
  logout() {
    this.setSessionToken(null);
  }

  /** Use after GET /users/me if you prefer server as source of truth */
  setUserFromMe(me: Partial<JwtUser>) {
    // Merge with existing decoded user to keep missing fields stable
    const current = this.user || ({} as JwtUser);
    const next: JwtUser = {
      id: (me.id ?? (current as any).id) as string,
      email: (me.email ?? current?.email) as string,
      role: (me.role ?? current?.role) as string,
      firstName: me.firstName ?? current?.firstName,
      lastName: me.lastName ?? current?.lastName,
      officialFlags: me.officialFlags ?? current?.officialFlags ?? {},
    };
    this._user$.next(next);
  }

  /*************** RBAC helpers (match backend policy) ***************/
  hasRole(...roles: (ROLES | string)[]) {
    return !!this.user && roles.includes(this.user.role as ROLES);
  }
  isAdminOfficial() {
    return this.user?.role === ROLES.OFFICIAL && !!this.user?.officialFlags?.isAdminOfficial;
  }
  isChief() {
    return this.user?.role === ROLES.CHIEF_MASTER;
  }
  isAdminOfficialOrChief() {
    return this.isChief() || this.isAdminOfficial();
  }

  /** Normalize alias -> enum */
  private normalizePerm(p: PermOrAlias | null | undefined): PERMISSIONS | null {
    if (!p) return null;
    const asEnum = Object.values(PERMISSIONS).includes(p as PERMISSIONS);
    return asEnum ? (p as PERMISSIONS) : (PERM_ALIASES[p as string] || null);
  }

  /** Frontend `can()` aligned to backend `policy.can()` */
  can(permOrAlias: PermOrAlias): boolean {
    const p = this.normalizePerm(permOrAlias);
    const u = this.user;
    if (!p || !u) return false;

    // Base role-permission set — keep this aligned with ROLE_PERMISSIONS + ADMIN_OFFICIAL_EXTRA.
    const rolePerms = new Set<PERMISSIONS>();
    switch (u.role as ROLES) {
      case ROLES.CHIEF_MASTER:
        Object.values(PERMISSIONS).forEach(v => rolePerms.add(v));
        break;
      case ROLES.OFFICIAL:
        rolePerms.add(PERMISSIONS.APPLICATION_REVIEW);
        if (this.isAdminOfficial()) {
          rolePerms.add(PERMISSIONS.WINDOW_CREATE);
          rolePerms.add(PERMISSIONS.WINDOW_UPDATE);
          rolePerms.add(PERMISSIONS.WINDOW_DELETE);
          rolePerms.add(PERMISSIONS.USER_DISABLE_LIQUIDATOR);
          rolePerms.add(PERMISSIONS.USER_UPDATE_ROLE);
          rolePerms.add(PERMISSIONS.USERS_DEACTIVATE);
          rolePerms.add(PERMISSIONS.USERS_ACTIVATE);
        }
        break;
      case ROLES.LIQUIDATOR:
      default:
        // usually none
        break;
    }
    if (!rolePerms.has(p)) return false;

    // Extra rule identical to backend for approve/reject:
    if (['applications:approve', 'applications:reject'].includes(String(permOrAlias))) {
      return this.isChief() || this.isAdminOfficial();
    }
    return true;
  }

  /*************** HTTP (unchanged endpoints) ***************/
  // --- Registration & Login ---
  register(data: { firstName: string; lastName: string; email: string; password: string; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: { email: string; password: string; }): Observable<{ token: string; user: any }> {
    return this.http.post<{ token: string; user: any }>(`${this.apiUrl}/login`, data);
  }

  // --- Email verification OTP ---
  verifyEmail(data: { email: string; code: string; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, data);
  }

  resendEmailOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-otp`, { email });
  }

  // --- Password reset via OTP ---
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password/reset/request`, { email });
  }

  resetPasswordWithOtp(params: { email: string; code: string; newPassword: string; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/password/reset/confirm`, params);
  }

  // --- Me ---
  me(): Observable<JwtUser> {
    return this.http.get<JwtUser>(`http://localhost:3000/api/users/me`);
  }

  // --- Admin / approval (auth header handled by interceptor) ---
  approveUser(userId: string): Observable<any> {
    return this.http.patch(`${this.usersUrl}/${userId}/approve`, {});
  }

  declineUser(userId: string, reason?: string): Observable<any> {
    return this.http.patch(`${this.usersUrl}/${userId}/decline`, { reason: reason || null });
  }

  setAdminOfficialFlag(userId: string, isAdminOfficial: boolean): Observable<any> {
    return this.http.patch(`${this.usersUrl}/${userId}/admin-flag`, { isAdminOfficial });
  }

  deactivateUser(userId: string, reason?: string): Observable<any> {
    return this.http.patch(`${this.usersUrl}/${userId}/deactivate`, { reason: reason || null });
  }

  activateUser(userId: string): Observable<any> {
    return this.http.patch(`${this.usersUrl}/${userId}/activate`, {});
  }

  listUsers(params?: {
    page?: number; limit?: number; q?: string; role?: string;
    isActive?: boolean | string; approvalStatus?: string; sort?: string; dir?: 'asc'|'desc';
  }): Observable<any> {
    return this.http.get(`${this.usersUrl}`, { params: (params as any) || {} });
  }

  /*************** Legacy helper kept for compatibility ***************/
  decodeToken(): any {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  /*************** Internals ***************/
  private decodeUser(token: string | null): JwtUser | null {
    if (!token) return null;
    try {
      const p: any = jwtDecode(token);
      if (p.exp && Date.now() >= p.exp * 1000) return null;
      return {
        id: p.id,
        email: p.email,
        role: p.role as ROLES,
        firstName: p.firstName,
        lastName: p.lastName,
        officialFlags: p.officialFlags || {},
      };
    } catch {
      return null;
    }
  }

  
}
