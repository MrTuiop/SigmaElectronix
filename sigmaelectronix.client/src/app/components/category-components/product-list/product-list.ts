import { Component, Input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideSlidersHorizontal,
  LucideStar,
  LucideHeart,
  LucideShoppingCart,
  LucideCheck
} from '@lucide/angular';

interface ProductSpec {
  label: string;
  value: string;
}

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  gradient: string;
  icon: string;
  specs: ProductSpec[];
  inStock: boolean;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideStar,
    LucideHeart,
    LucideShoppingCart,
    LucideCheck
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit {
  @Input() categorySlug!: string;

  allProducts = signal<Product[]>([]);
  displayedProducts = signal<Product[]>([]);
  page = signal(1);
  readonly pageSize = 6; // Для длинных карточек лучше показывать поменьше за раз
  hasMore = computed(() => this.displayedProducts().length < this.allProducts().length);

  // Фильтры
  priceRange = signal({ min: 0, max: 200000 });
  selectedBrands = signal<string[]>([]);
  brands = ['Apple', 'Samsung', 'Sony', 'Xiaomi', 'ASUS'];

  // Сортировка
  sortBy = signal<'popular' | 'price-asc' | 'price-desc' | 'new'>('popular');

  ngOnInit(): void {
    this.resetAndLoad();
  }

  resetAndLoad(): void {
    this.allProducts.set(this.generateMockProducts(15));
    this.displayedProducts.set([]);
    this.page.set(1);
    this.loadMore();
  }

  loadMore(): void {
    const currentPage = this.page();
    const end = currentPage * this.pageSize;
    const filtered = this.applyFilters(this.allProducts());
    const sorted = this.applySort(filtered);
    this.displayedProducts.set(sorted.slice(0, end));
    this.page.update(p => p + 1);
  }

  applyFilters(products: Product[]): Product[] {
    let result = products;
    if (this.selectedBrands().length > 0) {
      result = result.filter(p => this.selectedBrands().includes(p.brand));
    }
    const { min, max } = this.priceRange();
    result = result.filter(p => p.price >= min && p.price <= max);
    return result;
  }

  applySort(products: Product[]): Product[] {
    const type = this.sortBy();
    if (type === 'price-asc') return [...products].sort((a, b) => a.price - b.price);
    if (type === 'price-desc') return [...products].sort((a, b) => b.price - a.price);
    if (type === 'new') return [...products].reverse();
    return products;
  }

  clearFilters(): void {
    this.selectedBrands.set([]);
    this.priceRange.set({ min: 0, max: 200000 });
    this.resetAndLoad();
  }

  toggleBrand(brand: string): void {
    this.selectedBrands.update(v =>
      v.includes(brand) ? v.filter(b => b !== brand) : [...v, brand]
    );
    this.resetAndLoad();
  }

  private generateMockProducts(count: number): Product[] {
    const icons = ['smartphone', 'laptop', 'headphones', 'watch', 'tv', 'gamepad-2'];
    const brands = ['Apple', 'Samsung', 'Sony', 'Xiaomi', 'ASUS'];
    const products: Product[] = [];

    for (let i = 0; i < count; i++) {
      const currentBrand = brands[i % brands.length];
      products.push({
        id: i + 1,
        name: `${currentBrand} Флагман Модель ${i + 1}`,
        brand: currentBrand,
        price: Math.floor(Math.random() * 140000) + 9000,
        oldPrice: Math.random() > 0.4 ? Math.floor(Math.random() * 180000) + 15000 : undefined,
        discount: Math.random() > 0.4 ? Math.floor(Math.random() * 25) + 5 : undefined,
        rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        reviews: Math.floor(Math.random() * 280) + 5,
        gradient: `linear-gradient(135deg, #764ba2, #667eea)`,
        icon: icons[i % icons.length],
        inStock: Math.random() > 0.15,
        specs: [
          { label: 'Экран', value: '6.7", OLED, 120 Гц' },
          { label: 'Процессор', value: '8-ядерный мощный чипсет' },
          { label: 'Память', value: '12 ГБ / 256 ГБ' },
          { label: 'Гарантия', value: '12 месяцев' }
        ]
      });
    }
    return products;
  }
}
