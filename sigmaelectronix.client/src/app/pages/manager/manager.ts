import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service'; // Проверь правильность пути к сервису
import {
  LucideLayoutDashboard,
  LucidePackage,
  LucideFolderTree,
  LucideAward,
  LucideUsers,
  LucideLogOut,
  LucideMenu,
  LucideStore // <-- Добавили иконку магазина
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
    LucideStore // <-- Добавили в imports
  ],
  templateUrl: './manager.html',
  styleUrl: './manager.css'
})
export class ManagerPage {
  // Инжектируем сервис авторизации
  private authService = inject(AuthService);

  isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  logout() {
    // Вызываем реальный метод выхода из сервиса
    this.authService.logout();
  }
}
