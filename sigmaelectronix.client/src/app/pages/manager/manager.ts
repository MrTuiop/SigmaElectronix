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
  LucideBoxes,
  LucideShield,
  LucideFileEdit // <-- ДОБАВИЛИ НОВУЮ ИКОНКУ
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
    LucideTicket,
    LucideTruck,
    LucideBoxes,
    LucideShield,
    LucideFileEdit // <-- НЕ ЗАБЫВАЕМ ДОБАВИТЬ В IMPORTS
  ],
  templateUrl: './manager.html',
  styleUrl: './manager.css'
})
export class ManagerPage {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  isAdmin = computed(() => {
    return this.authService.isAdmin();
  });

  isSidebarCollapsed = signal(false);

  // Умное вычисление имени
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

  // Умное вычисление роли
  managerRoleDisplay = computed(() => {
    const token = this.authService.token();
    if (!token) return 'Контент-отдел';

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload['role'];
      const isAdmin = Array.isArray(roles) ? roles.includes('Admin') : roles === 'Admin';

      if (isAdmin) {
        return 'Администратор системы';
      }
    } catch (e) {
      console.error('Ошибка чтения токена', e);
    }

    return 'Контент-отдел';
  });

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
