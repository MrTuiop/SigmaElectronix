import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrandService } from '../../../services/brand-service';
import { BrandListDto, CreateBrandDto } from '../../../models/brand-models';
import {
  LucideAward, LucidePlus, LucideTrash2, LucideEdit2,
  LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
  LucideCheck, LucideChevronLeft, LucideChevronRight, LucideSparkles,
  LucideStar,
  LucideChevronDown,
  LucideChevronUp,
  LucideSearch
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-brands',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAward, LucidePlus, LucideTrash2, LucideEdit2,
    LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
    LucideCheck, LucideChevronLeft, LucideChevronRight, LucideSparkles, LucideStar, LucideChevronUp, LucideChevronDown, LucideSearch,
    SpinnerComponent
  ],
  templateUrl: './manager-brands.html',
  styleUrl: './manager-brands.css'
})
export class ManagerBrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  private fb = inject(FormBuilder);

  brands = signal<BrandListDto[]>([]);
  pageNumber = signal(1);
  pageSize = signal(15);
  totalCount = signal(0);
  totalPages = signal(0);
  loading = signal(false);
  isLoadingMore = signal(false);

  viewMode = signal<'list' | 'create'>('list');
  currentStep = signal(1);
  brandForm!: FormGroup;

  isEditing = signal(false);
  editingId = signal<number | null>(null);

  searchQuery = signal('');
  currentSort = signal('name_asc'); // По умолчанию по алфавиту
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadBrands();
    this.initForm();
  }

  loadBrands(): void {
    // Включаем основной лоадер только для первой страницы
    if (this.pageNumber() === 1) this.loading.set(true);
    else this.isLoadingMore.set(true);

    this.brandService.getBrands(
      this.pageNumber(),
      this.pageSize(),
      this.searchQuery(),
      this.currentSort()
    ).subscribe({
      next: (res) => {
        if (this.pageNumber() === 1) {
          this.brands.set(res.items); // Перезаписываем (при поиске/сортировке)
        } else {
          // ДОБАВЛЯЕМ новые в конец массива (при скролле)
          this.brands.update(prev => [...prev, ...res.items]);
        }

        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  resetAndLoad(): void {
    this.pageNumber.set(1);
    this.loadBrands();
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.searchQuery.set(value);
      this.resetAndLoad();
    }, 500);
  }

  toggleSort(column: 'name' | 'featured' | 'status' | 'count'): void {
    const current = this.currentSort();
    let nextSort = 'name_asc';

    if (column === 'name') {
      nextSort = current === 'name_asc' ? 'name_desc' : 'name_asc';
    } else if (column === 'featured') {
      nextSort = current === 'featured_desc' ? 'featured_asc' : 'featured_desc';
    } else if (column === 'status') {
      nextSort = current === 'status_desc' ? 'status_asc' : 'status_desc';
    } else if (column === 'count') {
      nextSort = current === 'count_desc' ? 'count_asc' : 'count_desc';
    }

    this.currentSort.set(nextSort);
    this.resetAndLoad();
  }

  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;

    // Если до конца таблицы осталось меньше 100px
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      // И если мы сейчас не грузим данные, и в базе еще есть не загруженные бренды
      if (!this.loading() && !this.isLoadingMore() && this.brands().length < this.totalCount()) {
        this.pageNumber.update(p => p + 1);
        this.loadBrands();
      }
    }
  }

  initForm(): void {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9\-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]], // 👈 Описание обязательно от 10 символов
      logoUrl: [''],
      heroImageUrl: [''],
      heroTitle: [''],
      heroSubtitle: [''],
      bannerButtonText: [''],
      isFeatured: [false],
      isActive: [true]
    });

    this.brandForm.get('name')?.valueChanges.subscribe(name => {
      if (name) {
        const generatedSlug = this.slugify(name);
        this.brandForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });
  }

  slugify(text: string): string {
    const ru = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    let slug = text.toLowerCase();
    let newSlug = '';
    for (let i = 0; i < slug.length; i++) {
      const char = slug[i];
      newSlug += ru[char as keyof typeof ru] !== undefined ? ru[char as keyof typeof ru] : char;
    }
    return newSlug
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  openCreateMode(): void {
    this.isEditing.set(false);     // Сбрасываем флаг редактирования
    this.editingId.set(null);      // Очищаем ID
    this.brandForm.reset({ isActive: true, isFeatured: false });
    this.currentStep.set(1);
    this.viewMode.set('create');
  }

  closeCreateMode(): void {
    this.viewMode.set('list');
  }

  // 🚀 ПРОВЕРКА ПЕРВОГО ШАГА
  isStep1Valid(): boolean {
    const f = this.brandForm.controls;
    return f['name'].valid && f['slug'].valid && f['description'].valid;
  }

  editBrand(brand: BrandListDto): void {
    // Включаем лоадер, пока ждем полные данные с сервера
    this.loading.set(true);

    // Делаем запрос за полными данными бренда (BrandShowcaseDto)
    this.brandService.getBrandBySlug(brand.slug).subscribe({
      next: (fullBrand) => {
        this.isEditing.set(true);
        this.editingId.set(fullBrand.id);

        // Заполняем форму: часть данных берем из полной модели, 
        // а статусы (isActive, isFeatured) берем из списка, так как их нет в ShowcaseDto
        this.brandForm.patchValue({
          name: fullBrand.name,
          slug: fullBrand.slug,
          description: fullBrand.description,
          logoUrl: fullBrand.logoUrl || '',
          heroImageUrl: fullBrand.heroImageUrl || '',
          heroTitle: fullBrand.heroTitle || '',
          heroSubtitle: fullBrand.heroSubtitle || '',
          bannerButtonText: fullBrand.bannerButtonText || '',
          isFeatured: brand.isFeatured,
          isActive: brand.isActive
        });

        this.currentStep.set(1);
        this.viewMode.set('create'); // Открываем форму
        this.loading.set(false);     // Выключаем лоадер
      },
      error: () => {
        alert('Не удалось загрузить полные данные бренда для редактирования');
        this.loading.set(false);
      }
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1 && this.isStep1Valid()) {
      this.currentStep.set(2);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(1);
    }
  }

  saveBrand(): void {
    if (this.brandForm.invalid) {
      alert('Проверьте правильность заполнения всех обязательных полей.');
      return;
    }

    this.loading.set(true);
    const dto = this.brandForm.value;

    if (this.isEditing() && this.editingId()) {
      // 🚀 РЕДАКТИРОВАНИЕ
      this.brandService.updateBrand(this.editingId()!, dto).subscribe({
        next: () => {
          this.loadBrands();
          this.viewMode.set('list');
        },
        error: () => {
          alert('Ошибка при обновлении бренда');
          this.loading.set(false);
        }
      });
    } else {
      // 🚀 СОЗДАНИЕ НОВОГО (Твой старый код)
      this.brandService.createBrand(dto).subscribe({
        next: () => {
          this.loadBrands();
          this.viewMode.set('list');
        },
        error: () => {
          alert('Ошибка при сохранении бренда');
          this.loading.set(false);
        }
      });
    }
  }

  // --- Переключение видимости (Опубликован / Скрыт) ---
  toggleActive(brand: any): void {
    const originalStatus = brand.isActive;
    brand.isActive = !brand.isActive; // Мгновенно меняем в UI

    // Предполагается, что в твоем BrandService есть такой метод.
    // Если его нет, тебе нужно будет его добавить по аналогии с товарами.
    this.brandService.toggleActiveStatus(brand.id).subscribe({
      error: () => {
        brand.isActive = originalStatus; // Возвращаем как было при ошибке
        alert('Не удалось изменить статус бренда');
      }
    });
  }

  // --- Переключение показа на главной ---
  toggleFeatured(brand: any): void {
    const originalStatus = brand.isFeatured;
    brand.isFeatured = !brand.isFeatured; // Мгновенно меняем в UI

    // И этот метод тоже нужно будет добавить в BrandService
    this.brandService.toggleFeaturedStatus(brand.id).subscribe({
      error: () => {
        brand.isFeatured = originalStatus;
        alert('Не удалось изменить статус показа на главной');
      }
    });
  }

  deleteBrand(id: number, name: string): void {
    if (confirm(`Вы уверены, что хотите удалить бренд "${name}"?`)) {
      this.loading.set(true);
      this.brandService.deleteBrand(id).subscribe({
        next: () => this.loadBrands(),
        error: () => {
          alert('Ошибка при удалении бренда');
          this.loading.set(false);
        }
      });
    }
  }

  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.pageNumber.set(newPage);
      this.loadBrands();
    }
  }
}
