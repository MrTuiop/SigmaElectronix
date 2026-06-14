import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { ProfileService } from '../../services/profile-service';
import {
  LucideLayoutDashboard,
  LucidePackage,
  LucideFolderTree,
  LucideAward,
  LucideUsers,
  LucideLogOut,
  LucideMenu,
  LucideStore,
  LucideMessageSquare,
  LucideMapPin,
  LucideMap,
  LucideGlobe,
  LucideTruck,
  LucideTicket,
  LucideBoxes
} from '@lucide/angular';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideLayoutDashboard,
    LucidePackage,
    LucideFolderTree,
    LucideAward,
    LucideUsers,
    LucideLogOut,
    LucideMenu,
    LucideStore,
    LucideMessageSquare,
    LucideMapPin,
    LucideMap,
    LucideGlobe,
    LucideTicket, // <-- Купоны
    LucideTruck,  // <-- Поступления/перемещения
    LucideBoxes
  ],
  templateUrl: './manager.html',
  styleUrl: './manager.css'
})
export class ManagerPage {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  isSidebarCollapsed = signal(false);

  // Умное вычисление имени (как мы сделали ранее)
  managerName = computed(() => {
    const u = this.profileService.user();
    if (!u) return 'Загрузка...';

    if (u.firstName || u.lastName) {
      return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    }

    return u.userName;
  });

  managerAvatar = computed(() => {
    return this.profileService.user()?.avatarUrl || '/assets/avatar-placeholder.png';
  });

  // НОВОЕ: Умное вычисление роли
  managerRoleDisplay = computed(() => {
    const token = this.authService.token();
    if (!token) return 'Контент-отдел'; // Значение по умолчанию

    try {
      // Расшифровываем среднюю часть JWT-токена (payload)
      const payload = JSON.parse(atob(token.split('.')[1]));

      // В ASP.NET Identity роли лежат в этом длинном ключе (или просто в 'role')
      const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'];

      // Проверяем, есть ли 'Admin' (roles может быть массивом или строкой)
      const isAdmin = Array.isArray(roles) ? roles.includes('Admin') : roles === 'Admin';

      if (isAdmin) {
        return 'Администратор системы';
      }
    } catch (e) {
      console.error('Ошибка чтения токена', e);
    }

    // Если код дошел сюда, значит роли Admin нет, выводим для менеджера:
    return 'Контент-отдел';
  });

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
