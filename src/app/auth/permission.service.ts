import { Injectable } from '@angular/core';
import { AuthService } from './../services/auth.service';
import { PERMISSIONS, PERM_ALIASES, PermOrAlias, ROLES } from './permissions';
import { JwtUser } from './models';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private auth: AuthService) {}

  private isAdminOfficial(u: JwtUser | null) {
    return u?.role === ROLES.OFFICIAL && !!u?.officialFlags?.isAdminOfficial;
  }
  private isChief(u: JwtUser | null) {
    return u?.role === ROLES.CHIEF_MASTER;
  }

  /** Normalize string alias -> enum */
  private normalizePerm(p: PermOrAlias | null | undefined): PERMISSIONS | null {
    if (!p) return null;
    if (Object.values(PERMISSIONS).includes(p as PERMISSIONS)) return p as PERMISSIONS;
    return PERM_ALIASES[p as string] || null;
  }

  /** Core permission gate */
  can(permOrAlias: PermOrAlias): boolean {
    const p = this.normalizePerm(permOrAlias);
    const u = this.auth.user;
    if (!p || !u) return false;

    // Base role-permission map (align to backend ROLE_PERMISSIONS + ADMIN_OFFICIAL_EXTRA)
    const base = new Set<PERMISSIONS>();
    switch (u.role as ROLES) {
      case ROLES.CHIEF_MASTER:
        Object.values(PERMISSIONS).forEach(v => base.add(v));
        break;
      case ROLES.OFFICIAL:
        // baseline official perms:
        base.add(PERMISSIONS.APPLICATION_REVIEW);
        // add extras if admin official:
        if (this.isAdminOfficial(u)) {
          base.add(PERMISSIONS.WINDOW_CREATE);
          base.add(PERMISSIONS.WINDOW_UPDATE);
          base.add(PERMISSIONS.WINDOW_DELETE);
          base.add(PERMISSIONS.USER_DISABLE_LIQUIDATOR);
          base.add(PERMISSIONS.USER_UPDATE_ROLE);
          base.add(PERMISSIONS.USERS_DEACTIVATE);
          base.add(PERMISSIONS.USERS_ACTIVATE);
        }
        break;
      case ROLES.LIQUIDATOR:
      default:
        // Usually none
        break;
    }

    if (!base.has(p)) return false;

    // Extra rule: approve/reject require Chief or Admin Official (same as backend)
    if (['applications:approve', 'applications:reject'].includes(String(permOrAlias))) {
      return this.isChief(u) || this.isAdminOfficial(u);
    }
    return true;
  }

  /** Role checks */
  hasRole(...roles: (ROLES | string)[]) {
    const u = this.auth.user;
    if (!u) return false;
    return roles.includes(u.role as ROLES);
  }

  /** AdminOfficialOrChief */
  isAdminOfficialOrChief() {
    const u = this.auth.user;
    return this.isChief(u) || this.isAdminOfficial(u);
  }
}
