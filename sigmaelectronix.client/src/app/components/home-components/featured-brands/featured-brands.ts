import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BrandListDto } from '../../../models/brand-models';
import { BrandService } from '../../../services/brand-service';
import { LucideImage, LucidePackage, LucideArrowRight } from '@lucide/angular';

@Component({
  selector: 'app-featured-brands',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideImage,
    LucidePackage,
    LucideArrowRight
  ],
  templateUrl: './featured-brands.html',
  styleUrl: './featured-brands.css',
})
export class FeaturedBrandsComponent implements OnInit {
  @Input() count: number = 6;

  brands: BrandListDto[] = [];
  loading = true;
  error: string | null = null;

  skeletonArray = Array(6).fill(0);

  constructor(
    private brandService: BrandService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.loading = true;
    this.error = null;

    this.brandService.loadFeaturedBrands(this.count).subscribe({
      next: (data: BrandListDto[]) => {
        this.brands = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Ошибка загрузки брендов', err);
        this.error = 'Не удалось загрузить бренды';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
