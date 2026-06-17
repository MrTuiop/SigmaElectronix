// src/app/guards/manager.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const managerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Проверяем: 1. Авторизован ли? 2. Есть ли права менеджера/админа?
  if (authService.isAuthenticated() && authService.isManager()) {
    return true; // Пускаем в админку
  }

  // Если это обычный юзер или гость, отправляем на главную
  return router.createUrlTree(['/']);
};
