import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  LucideMapPin, LucideGlobe, LucideSun, LucideMoon, LucideSearch,
  LucideHeart, LucideShoppingCart, LucideUser,
  LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch, LucideTv, LucideGamepad2,
  LucideLayoutDashboard
} from '@lucide/angular';
import { AuthModalComponent } from '../auth-components/auth-modal/auth-modal';
import { AuthService } from '../../services/auth-service';
import { ProfileService } from '../../services/profile-service';
import { CategoryMenuComponent } from '../category-components/category-menu/category-menu';
import { WishlistService } from '../../services/wishlist-service';
import { CartService } from '../../services/cart-service';
import { SearchBarComponent } from '../header-components/search-bar/search-bar';
import { LocationSelectorComponent } from '../header-components/location-selector/location-selector';
import { LanguageSelectorComponent } from '../header-components/language-selector/language-selector';
import { TranslateDirective } from '@ngx-translate/core';

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
    AuthModalComponent, SearchBarComponent, LocationSelectorComponent, LucideLayoutDashboard, LanguageSelectorComponent, TranslateDirective
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit{

  private auth = inject(AuthService);
  private profile = inject(ProfileService);
  private router = inject(Router);
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);

  readonly isManager = computed(() => this.auth.isManager());

  // Теперь счётчик берётся из сервиса
  readonly favoritesCount = computed(() => this.wishlistService.totalItems());

  // 🔹 Счётчик корзины – реактивно из CartService
  readonly cartCount = computed(() => this.cartService.totalItems());

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

  goToWishlist(): void {
    if (this.isLoggedIn()) {
      // Если авторизован -> в личный кабинет
      this.router.navigate(['/profile/wishlist']);
    } else {
      // Если гость -> на публичную страницу
      this.router.navigate(['/wishlist']);
    }
  }

  ngOnInit(): void {
    // Загружаем избранное, если пользователь уже авторизован
    if (this.isLoggedIn()) {
      this.wishlistService.loadWishlist().subscribe();
    }

    this.cartService.loadCart().subscribe();
    // Если неавторизован — счётчик и так будет 0, и бейдж скроется

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkTheme.set(true);
      document.body.classList.add('dark-theme');
    }
  }

  showAuthModal = signal(false);

  openAuthModal(): void {
    this.showAuthModal.set(true);
  }

  isCategoryMenuOpen = signal(false);
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
      localStorage.setItem('theme', 'dark'); // Сохраняем выбор
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light'); // Сохраняем выбор
    }
  }
}
