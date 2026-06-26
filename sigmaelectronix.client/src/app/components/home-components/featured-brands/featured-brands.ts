import { Component, Input, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandListDto } from '../../../models/brand-models';
import { BrandService } from '../../../services/brand-service';
import { LanguageService } from '../../../services/language-service'; // 👈 Импортируем LanguageService
import { LucideImage, LucidePackage, LucideArrowRight } from '@lucide/angular';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-featured-brands',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideImage,
    LucidePackage,
    LucideArrowRight,
    TranslateDirective
  ],
  templateUrl: './featured-brands.html',
  styleUrl: './featured-brands.css',
})
export class FeaturedBrandsComponent implements OnInit {
  @Input() count: number = 6;

  private brandService = inject(BrandService);
  private languageService = inject(LanguageService); // 👈 Инжектим

  private previousLanguage = signal<string>(this.languageService.currentLanguage()); // 👈 Отслеживаем прошлый язык

  loading = signal(true); // 👈 Теперь это сигнал
  error = signal<string | null>(null); // 👈 И это сигнал
  skeletonArray = Array(6).fill(0);

  // 👇 Берем бренды прямо из кэша сервиса (сигнала). 
  // При обновлении featuredBrands() в сервисе, этот computed пересчитается автоматически.
  brands = computed(() => this.brandService.featuredBrands().slice(0, this.count));

  // 👇 Магия effect: срабатывает только когда меняется currentLanguage
  private readonly languageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);
      this.loadBrands();
    }
  });

  ngOnInit(): void {
    // Если данные уже есть в кэше, не грузим повторно и скрываем лоадер
    if (this.brandService.featuredBrands().length > 0) {
      this.loading.set(false);
      return;
    }
    this.loadBrands();
  }

  loadBrands(): void {
    this.loading.set(true);
    this.error.set(null);

    this.brandService.loadFeaturedBrands(this.count).subscribe({
      next: () => {
        // Данные уже записались в сигнал featuredBrands() внутри сервиса через tap,
        // поэтому наш computed `brands` обновился автоматически.
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Ошибка загрузки брендов', err);
        this.error.set('Не удалось загрузить бренды');
        this.loading.set(false);
      }
    });
  }
}
