// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { ToastService } from '../services/toast'; // Если есть сервис уведомлений

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService); // опционально

  if (authService.isAuthenticated()) {
    return true; // Пускаем
  }

  // Если не авторизован - перекидываем на главную
  toast.info('Пожалуйста, войдите в систему');
  return router.createUrlTree(['/']);
};
