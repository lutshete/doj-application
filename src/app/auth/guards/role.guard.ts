import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { PermissionService } from '../permission.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const perms = inject(PermissionService);
  const roles = (route.data?.['roles'] as string[]) || [];
  return roles.length ? perms.hasRole(...roles) : true;
};
