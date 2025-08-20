import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { PermissionService } from '../permission.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const perms = inject(PermissionService);
  const need = route.data?.['permission'] as string | undefined;
  return need ? perms.can(need as any) : true;
};
