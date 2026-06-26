import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideArrowRight, LucideSmartphone, LucideLaptop, LucideHeadphones,
  LucideWatch, LucideTv, LucideGamepad2, LucideFolder,
  LucideMonitor, LucideCamera, LucideHome, LucideCoffee,
  LucideSnowflake, LucideLightbulb, LucideBot, LucideTablet,
  LucideCpu, LucideCircuitBoard, LucideServer, LucideHardDrive,
  LucideRouter, LucideNetwork, LucideWifi, LucideCable
} from '@lucide/angular';
import { CategoryDto } from '../../../models/category-models';
import { CategoryService } from '../../../services/category-service';
import { LanguageService } from '../../../services/language-service';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateDirective,
    LucideArrowRight,
    // ⚠️ ВАЖНО: Для работы *ngComponentOutlet все динамические иконки 
    // ОБЯЗАТЕЛЬНО должны быть импортированы сюда, иначе будет ошибка NG0912
    LucideSmartphone, LucideLaptop, LucideHeadphones, LucideWatch,
    LucideTv, LucideGamepad2, LucideFolder, LucideMonitor,
    LucideCamera, LucideHome, LucideCoffee, LucideSnowflake,
    LucideLightbulb, LucideBot, LucideTablet, LucideCpu,
    LucideCircuitBoard, LucideServer, LucideHardDrive, LucideRouter,
    LucideNetwork, LucideWifi, LucideCable
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent {
  private categoryService = inject(CategoryService);
  private languageService = inject(LanguageService);

  private previousLanguage = signal<string>(this.languageService.currentLanguage());

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(6).fill(0);

  // 📦 Единый словарь иконок
  private availableIcons: Record<string, any> = {
    'smartphone': LucideSmartphone,
    'laptop': LucideLaptop,
    'headphones': LucideHeadphones,
    'watch': LucideWatch,
    'tv': LucideTv,
    'gamepad-2': LucideGamepad2,
    'monitor': LucideMonitor,
    'camera': LucideCamera,
    'home': LucideHome,
    'coffee': LucideCoffee,
    'snowflake': LucideSnowflake,
    'lightbulb': LucideLightbulb,
    'bot': LucideBot,
    'tablet': LucideTablet,
    'cpu': LucideCpu,
    'circuit-board': LucideCircuitBoard,
    'server': LucideServer,
    'hard-drive': LucideHardDrive,
    'router': LucideRouter,
    'network': LucideNetwork,
    'wifi': LucideWifi,
    'cable': LucideCable,
    'folder': LucideFolder // Дефолтная заглушка
  };

  categories = computed<CategoryDto[]>(() => {
    const all = this.categoryService.allCategories();
    return all.filter(c => c.parentCategoryId == null);
  });

  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);

      this.categoryService.loadAll().subscribe({
        error: () => console.error('Ошибка перезагрузки категорий при смене языка')
      });
      this.categoryService.loadTree().subscribe({
        error: () => console.error('Ошибка перезагрузки дерева категорий при смене языка')
      });
    }
  });

  // 👇 В Angular 16+ при использовании inject() инициализацию лучше делать в constructor
  constructor() {
    if (this.categoryService.allCategories().length > 0) {
      this.loading.set(false);
      return;
    }

    this.categoryService.loadAll().subscribe({
      next: () => this.loading.set(false), // Signal сам обновит UI!
      error: () => {
        this.error.set('Не удалось загрузить категории');
        this.loading.set(false);
      }
    });
  }

  // 🎯 Максимально простой вывод: получаем ключ и берем компонент из словаря
  getIconComponent(cat: CategoryDto): any {
    const iconKey = cat.icon || this.mapIconType(cat);
    return this.availableIcons[iconKey] || LucideFolder;
  }

  private mapIconType(cat: CategoryDto): string {
    const name = cat.name.toLowerCase();
    if (name.includes('смартфон') || name.includes('телефон')) return 'smartphone';
    if (name.includes('ноутбук') || name.includes('laptop')) return 'laptop';
    if (name.includes('наушник') || name.includes('headphone')) return 'headphones';
    if (name.includes('час') || name.includes('watch')) return 'watch';
    if (name.includes('телевизор') || name.includes('tv')) return 'tv';
    if (name.includes('игр') || name.includes('game')) return 'gamepad-2';
    return 'folder'; // Возвращаем ключ папки по умолчанию
  }
}
