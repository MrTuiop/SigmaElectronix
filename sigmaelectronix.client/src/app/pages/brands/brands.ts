import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BrandService } from '../../services/brand-service';
import { BrandListDto } from '../../models/brand-models';
import { LucidePackage, LucideArrowRight, LucideSearch } from '@lucide/angular';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucidePackage,
    LucideArrowRight,
    LucideSearch,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './brands.html',
  styleUrl: './brands.css'
})
export class BrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  private titleService = inject(Title);
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ СЕРВИСА

  brands = signal<BrandListDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  skeletonArray = Array(8).fill(0);

  ngOnInit(): void {
    // 👈 ПЕРЕВОДИМ TITLE ВКЛАДКИ
    this.titleService.setTitle(this.translate.instant('BRANDS.PAGE_TITLE'));
    this.loadAllBrands();
  }

  loadAllBrands(): void {
    this.loading.set(true);
    this.brandService.getBrands(1, 50).subscribe({
      next: (response: any) => {
        this.brands.set(response.items || response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки брендов', err);
        // 👈 ПЕРЕВОДИМ ТЕКСТ ОШИБКИ
        this.error.set(this.translate.instant('BRANDS.LOAD_ERROR'));
        this.loading.set(false);
      }
    });
  }
}
