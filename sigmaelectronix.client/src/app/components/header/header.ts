import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  LucideMapPin, LucideGlobe, LucideSun, LucideMoon, LucideSearch,
  LucideHeart, LucideShoppingCart, LucideUser,
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2
} from '@lucide/angular';
import { AuthModalComponent } from '../auth-components/auth-modal/auth-modal';
import { AuthService } from '../../services/auth-service';
import { ProfileService } from '../../services/profile-service';
import { CategoryMenuComponent } from '../category-components/category-menu/category-menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoryMenuComponent,
    LucideMapPin, LucideGlobe, LucideSun, LucideMoon, LucideSearch,
    LucideHeart, LucideShoppingCart, LucideUser,
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
    AuthModalComponent
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private profile = inject(ProfileService);

  readonly isLoggedIn = computed(() => this.auth.token() !== null);

  // Отображаемое имя (ник) – берём firstName из профиля, если нет – пусто
  readonly displayName = computed(() => {
    const user = this.profile.user();
    return user?.firstName || user?.userName || 'user';
  });

  // Ссылка на аватарку
  readonly avatarUrl = computed(() => {
    const user = this.profile.user();
    return user?.avatarUrl ?? null;
  });

  showAuthModal = signal(false);

  openAuthModal(): void {
    this.showAuthModal.set(true);
  }

  isCategoryMenuOpen = signal(false);
  cartCount = signal(3);
  favoritesCount = signal(5);
  isDarkTheme = signal(false);

  searchQuery = signal('');
  defaultPlaceholder = 'Искать ноутбук, смартфон, наушники...';
  currentPlaceholder = signal(this.defaultPlaceholder);

  quickTags = signal(['Смартфоны', 'Ноутбуки RTX', 'AirPods Pro', 'PlayStation 5', 'Мониторы 4K']);

  hoverTimeout: any;

  toggleMenu() {
    this.isCategoryMenuOpen.update(isOpen => !isOpen);
  }

  toggleTheme() {
    this.isDarkTheme.update(dark => !dark);
    if (this.isDarkTheme()) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  onTagHover(tag: string) {
    clearTimeout(this.hoverTimeout);
    this.currentPlaceholder.set(`Нажмите, чтобы искать: "${tag}"`);
  }

  onTagLeave() {
    this.hoverTimeout = setTimeout(() => {
      this.currentPlaceholder.set(this.defaultPlaceholder);
    }, 50);
  }

  onTagClick(tag: string) {
    this.searchQuery.set(tag);
    this.triggerSearch();
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  triggerSearch() {
    if (this.searchQuery().trim()) {
      console.log('Запуск поиска на бэкенде для:', this.searchQuery());
    }
  }
}
