import { Component, inject, signal, computed, OnInit, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideArrowRight, LucideSmartphone, LucideLaptop, LucideHeadphones,
  LucideWatch, LucideTv, LucideGamepad2, LucideTag, LucideFolder,
  LucideMonitor, LucideCamera
} from '@lucide/angular';
import { CategoryDto } from '../../../models/category-models';
import { CategoryService } from '../../../services/category-service';
import { LanguageService } from '../../../services/language-service'; // 👈 Импортируем LanguageService

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideArrowRight,
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService); // 👈 Инжектим сервис

  private previousLanguage = signal<string>(this.languageService.currentLanguage()); // 👈 Отслеживаем прошлый язык

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(6).fill(0);

  // Массив доступных иконок
  availableIcons: Array<{ id: string, component: any }> = [
    { id: 'smartphone', component: LucideSmartphone },
    { id: 'laptop', component: LucideLaptop },
    { id: 'headphones', component: LucideHeadphones },
    { id: 'watch', component: LucideWatch },
    { id: 'tv', component: LucideTv },
    { id: 'gamepad-2', component: LucideGamepad2 },
    { id: 'monitor', component: LucideMonitor },
    { id: 'camera', component: LucideCamera },
    { id: 'folder', component: LucideFolder },
    { id: 'tag', component: LucideTag }
  ];

  // Берем просто чистые данные из сервиса
  categories = computed<CategoryDto[]>(() => {
    const all = this.categoryService.allCategories();
    return all.filter(c => c.parentCategoryId == null);
  });

  // 👇 Магия effect: срабатывает только когда меняется currentLanguage
  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);

      // Перезагружаем категории и дерево при смене языка
      this.categoryService.loadAll().subscribe({
        error: () => console.error('Ошибка перезагрузки категорий при смене языка')
      });

      // Обновляем дерево тоже, так как оно нужно для хлебных крошек на других страницах
      this.categoryService.loadTree().subscribe({
        error: () => console.error('Ошибка перезагрузки дерева категорий при смене языка')
      });
    }
  });

  ngOnInit(): void {
    if (this.categoryService.allCategories().length > 0) {
      this.loading.set(false);
      return;
    }
    this.categoryService.loadAll().subscribe({
      next: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки категорий', err);
        this.error.set('Не удалось загрузить категории');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  // Умное получение иконки
  getIconComponent(cat: CategoryDto): any {
    let iconId = cat.icon;

    // Фолбэк: если иконки в базе еще нет, подбираем по названию
    if (!iconId) {
      iconId = this.mapIconType(cat);
    }

    const icon = this.availableIcons.find(i => i.id === iconId);
    return icon ? icon.component : LucideTag;
  }

  private mapIconType(cat: CategoryDto): string {
    const name = cat.name.toLowerCase();
    if (name.includes('смартфон') || name.includes('телефон')) return 'smartphone';
    if (name.includes('ноутбук') || name.includes('laptop')) return 'laptop';
    if (name.includes('наушник') || name.includes('headphone')) return 'headphones';
    if (name.includes('час') || name.includes('watch')) return 'watch';
    if (name.includes('телевизор') || name.includes('tv')) return 'tv';
    if (name.includes('игр') || name.includes('game')) return 'gamepad-2';
    return 'tag';
  }
}
