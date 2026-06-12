import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideLayoutDashboard,
  LucidePackage,
  LucideFolderTree,
  LucideAward,
  LucideUsers,
  LucideLogOut,
  LucideMenu
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
    LucideMenu
  ],
  templateUrl: './manager.html',
  styleUrl: './manager.css'
})
export class ManagerPage {
  isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  logout() {
    // Вызов AuthService.logout()
  }
}
