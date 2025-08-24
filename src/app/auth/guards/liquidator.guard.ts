// src/app/auth/guards/liquidator.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ROLES } from 'src/app/services/auth.service';
import { map } from 'rxjs';

export const liquidatorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.user$.pipe(
    map(user => {
      const ok = !!user && user.role === ROLES.LIQUIDATOR;
      if (!ok) {
        // not a liquidator → kick to home (or admin)
        router.navigate(['/home']);
      }
      return ok;
    })
  );
};
