// auth/guards/admin-official-or-chief.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs';

export const adminOfficialOrChiefGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    map(u => {
      const ok = !!u && (auth.isAdminOfficialOrChief() || u.role === 'CHIEF_MASTER');
      if (!ok) router.navigate(['/home']);
      return ok;
    })
  );
};
