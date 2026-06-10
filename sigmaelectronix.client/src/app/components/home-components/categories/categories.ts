import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  LucideArrowRight, LucideSmartphone, LucideLaptop, LucideHeadphones,
  LucideWatch, LucideTv, LucideGamepad2, LucideTag
} from '@lucide/angular';

import { CategoryDto } from '../../../models/category-models';
import { CategoryService } from '../../../services/category-service';

interface UiCategory extends CategoryDto {
  iconType: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideArrowRight, LucideSmartphone, LucideLaptop, LucideHeadphones,
    LucideWatch, LucideTv, LucideGamepad2, LucideTag
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  error = signal<string | null>(null);
  skeletonArray = Array(6).fill(0);

  categories = computed<UiCategory[]>(() => {
    const all = this.categoryService.allCategories();
    // только корневые (без родителя)
    const roots = all.filter(c => c.parentCategoryId == null);
    return roots.map(c => ({
      ...c,
      iconType: this.mapIconType(c)
    }));
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
