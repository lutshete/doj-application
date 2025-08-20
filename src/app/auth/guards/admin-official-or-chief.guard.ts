import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { PermissionService } from '../permission.service';

export const adminOfficialOrChiefGuard: CanActivateFn = () => {
  const perms = inject(PermissionService);
  return perms.isAdminOfficialOrChief();
};
