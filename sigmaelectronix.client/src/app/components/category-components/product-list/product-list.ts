import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCartComponent } from '../product-cart/product-cart';



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
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCartComponent
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent {
  @Input() categorySlug!: string;

  // Заглушки товаров (в реальности — запрос к API)
  allProducts = signal<Product[]>(this.generateMockProducts(16));
  displayedProducts = signal<Product[]>([]);
  page = signal(1);
  readonly pageSize = 8;
  hasMore = computed(() => this.displayedProducts().length < this.allProducts().length);

  // Фильтры (заглушка)
  filterVisible = signal(false);
  priceRange = signal({ min: 0, max: 200000 });
  selectedBrands = signal<string[]>([]);
  brands = ['Apple', 'Samsung', 'Sony', 'Xiaomi', 'ASUS'];

  // Сортировка
  sortBy = signal<'popular' | 'price-asc' | 'price-desc' | 'new'>('popular');

  ngOnInit(): void {
    // При изменении categorySlug сбрасываем и загружаем
    this.resetAndLoad();
  }

  resetAndLoad(): void {
    this.allProducts.set(this.generateMockProducts(20));
    this.displayedProducts.set([]);
    this.page.set(1);
    this.loadMore();
  }

  loadMore(): void {
    const currentPage = this.page();
    const start = 0;
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
    return products; // popular (как есть)
  }

  toggleFilter(): void {
    this.filterVisible.update(v => !v);
  }

  clearFilters(): void {
    this.selectedBrands.set([]);
    this.priceRange.set({ min: 0, max: 200000 });
    this.resetAndLoad();
  }

  private generateMockProducts(count: number): Product[] {
    const icons = ['smartphone', 'laptop', 'headphones', 'watch', 'tv', 'gamepad-2'];
    const brands = ['Apple', 'Samsung', 'Sony', 'Xiaomi', 'ASUS'];
    const products: Product[] = [];
    for (let i = 0; i < count; i++) {
      products.push({
        id: i + 1,
        name: `Товар ${i + 1}`,
        brand: brands[i % brands.length],
        price: Math.floor(Math.random() * 150000) + 5000,
        oldPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 180000) + 10000 : undefined,
        discount: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 5 : undefined,
        rating: Math.floor(Math.random() * 3) + 2,
        reviews: Math.floor(Math.random() * 500),
        gradient: `linear-gradient(135deg, #667eea, #764ba2)`,
        icon: icons[i % icons.length]
      });
    }
    return products;
  }
}
