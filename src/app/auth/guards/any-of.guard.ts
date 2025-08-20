import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { PermissionService } from '../permission.service';

type AnyOfItem =
  | { role: string }
  | { permission: string }
  | { adminOfficialOrChief: true };

export const anyOfGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const perms = inject(PermissionService);
  const anyOf = (route.data?.['anyOf'] as AnyOfItem[]) || [];

  if (!anyOf.length) return true;

  return anyOf.some(item => {
    if ('role' in item) return perms.hasRole(item.role);
    if ('permission' in item) return perms.can(item.permission as any);
    if ('adminOfficialOrChief' in item) return perms.isAdminOfficialOrChief();
    return false;
  });
};
