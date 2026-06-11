import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BrandService } from '../../services/brand-service';
import { BrandListDto } from '../../models/brand-models';
import { LucidePackage, LucideArrowRight, LucideSearch } from '@lucide/angular';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, RouterModule, LucidePackage, LucideArrowRight, LucideSearch],
  templateUrl: './brands.html',
  styleUrl: './brands.css'
})
export class BrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  private titleService = inject(Title);

  brands = signal<BrandListDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Скелетоны для загрузки
  skeletonArray = Array(8).fill(0);

  ngOnInit(): void {
    this.titleService.setTitle('Все бренды | SigmaElectronix');
    this.loadAllBrands();
  }

  loadAllBrands(): void {
    this.loading.set(true);
    // Запрашиваем 1 страницу, берем с запасом 50 брендов
    this.brandService.getBrands(1, 50).subscribe({
      next: (response: any) => {
        // Учитываем, что бэкенд возвращает PagedResult<BrandListDto> (с полем items)
        this.brands.set(response.items || response);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки брендов', err);
        this.error.set('Не удалось загрузить список брендов. Попробуйте позже.');
        this.loading.set(false);
      }
    });
  }
}
