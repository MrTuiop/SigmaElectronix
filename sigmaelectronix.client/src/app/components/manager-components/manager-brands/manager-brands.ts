import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrandService } from '../../../services/brand-service';
import { BrandListDto } from '../../../models/brand-models';
import { HttpEventType } from '@angular/common/http'; // 👈 Добавили для прогресса
import {
  LucideAward, LucidePlus, LucideTrash2, LucideEdit2,
  LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
  LucideCheck, LucideChevronLeft, LucideChevronRight, LucideSparkles,
  LucideStar, LucideChevronDown, LucideChevronUp, LucideSearch, LucideX
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { FileService } from '../../../services/file-service';

@Component({
  selector: 'app-manager-brands',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    LucideAward, LucidePlus, LucideTrash2, LucideEdit2,
    LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
    LucideCheck, LucideChevronLeft, LucideChevronRight, LucideSparkles, LucideStar, LucideChevronUp, LucideChevronDown, LucideSearch, LucideX,
    SpinnerComponent
  ],
  templateUrl: './manager-brands.html',
  styleUrl: './manager-brands.css'
})
export class ManagerBrandsComponent implements OnInit, OnDestroy { // 👈 Подключили OnDestroy
  private brandService = inject(BrandService);
  private fb = inject(FormBuilder);
  private fileService = inject(FileService);

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
  currentSort = signal('name_asc');
  private searchTimeout: any;

  // 🚀 Состояния для загрузки и Drag&Drop
  isUploadingLogo = signal(false);
  isUploadingHero = signal(false);
  isDragoverLogo = signal(false);
  isDragoverHero = signal(false);
  logoUploadProgress = signal(0); // 👈 Прогресс загрузки лого (0-100)
  heroUploadProgress = signal(0); // 👈 Прогресс загрузки баннера (0-100)

  // 🚀 Списки для "СБОРЩИКА МУСОРА"
  private tempUploadedFiles: string[] = [];     // Временные файлы (те, что юзер загрузил только что)
  private filesToDeleteOnSave: string[] = [];   // Оригиналы (с бэка), от которых юзер отказался
  private originalLogoUrl: string = '';         // Запомненный оригинал логотипа
  private originalHeroUrl: string = '';         // Запомненный оригинал баннера

  ngOnInit(): void {
    this.loadBrands();
    this.initForm();
  }

  // Если менеджер просто закрыл вкладку или перешел на другую страницу (маршрут)
  ngOnDestroy(): void {
    this.cleanupTempFiles();
  }

  // 🚀 ОЧИСТКА МУСОРА (Вызывается при отмене)
  private cleanupTempFiles(): void {
    this.tempUploadedFiles.forEach(url => {
      this.fileService.deleteImage(url).subscribe(); // Удаляем всё, что загрузили временно
    });
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = []; // Сбрасываем очередь, оригиналы спасены!
  }

  // --- МЕТОДЫ DRAG AND DROP ---
  onDragOver(event: DragEvent, field: 'logoUrl' | 'heroImageUrl'): void {
    event.preventDefault();
    event.stopPropagation();
    if (field === 'logoUrl') this.isDragoverLogo.set(true);
    else this.isDragoverHero.set(true);
  }

  onDragLeave(event: DragEvent, field: 'logoUrl' | 'heroImageUrl'): void {
    event.preventDefault();
    event.stopPropagation();
    if (field === 'logoUrl') this.isDragoverLogo.set(false);
    else this.isDragoverHero.set(false);
  }

  onDrop(event: DragEvent, field: 'logoUrl' | 'heroImageUrl'): void {
    event.preventDefault();
    event.stopPropagation();
    if (field === 'logoUrl') this.isDragoverLogo.set(false);
    else this.isDragoverHero.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFileUpload(file, field);
  }

  onImageSelected(event: Event, field: 'logoUrl' | 'heroImageUrl'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFileUpload(file, field);
  }

  // 🚀 ОБНОВЛЕННАЯ ЛОГИКА ЗАГРУЗКИ (С Прогресс-баром и Сборщиком мусора)
  private handleFileUpload(file: File, field: 'logoUrl' | 'heroImageUrl'): void {
    // Включаем спиннер и сбрасываем проценты в 0
    if (field === 'logoUrl') {
      this.isUploadingLogo.set(true);
      this.logoUploadProgress.set(0);
    } else {
      this.isUploadingHero.set(true);
      this.heroUploadProgress.set(0);
    }

    this.fileService.uploadImageWithProgress(file, 'brands').subscribe({
      next: (event: any) => {
        // Отлавливаем проценты
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          if (field === 'logoUrl') this.logoUploadProgress.set(percentDone);
          else this.heroUploadProgress.set(percentDone);
        }
        // Загрузка завершена! Бэкенд прислал URL
        else if (event.type === HttpEventType.Response) {
          const res = event.body;
          if (res?.url) {
            const prevUrl = this.brandForm.get(field)?.value;

            // Логика мусора: если мы заменяем картинку
            if (prevUrl) {
              if (this.tempUploadedFiles.includes(prevUrl)) {
                // Если мы заменяем временную картинку другой временной - старую сразу удаляем
                this.fileService.deleteImage(prevUrl).subscribe();
                this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== prevUrl);
              } else if (prevUrl === this.originalLogoUrl || prevUrl === this.originalHeroUrl) {
                // Если мы заменяем оригинальную картинку - ставим её в очередь на удаление
                this.filesToDeleteOnSave.push(prevUrl);
              }
            }

            this.brandForm.patchValue({ [field]: res.url });
            this.tempUploadedFiles.push(res.url); // Запоминаем новую картинку в "корзине"

            if (field === 'logoUrl') this.isUploadingLogo.set(false);
            else this.isUploadingHero.set(false);
          }
        }
      },
      error: () => {
        alert('Ошибка при загрузке картинки');
        if (field === 'logoUrl') this.isUploadingLogo.set(false);
        else this.isUploadingHero.set(false);
      }
    });
  }

  // 🚀 ОБНОВЛЕННАЯ ЛОГИКА УДАЛЕНИЯ КАРТИНКИ
  removeImage(field: 'logoUrl' | 'heroImageUrl'): void {
    const currentUrl = this.brandForm.get(field)?.value;
    if (!currentUrl) return;

    if (this.tempUploadedFiles.includes(currentUrl)) {
      // Это временная - сносим сразу
      this.fileService.deleteImage(currentUrl).subscribe();
      this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== currentUrl);
    } else if (currentUrl === this.originalLogoUrl || currentUrl === this.originalHeroUrl) {
      // Это оригинал с сервера - только ставим в очередь!
      this.filesToDeleteOnSave.push(currentUrl);
    }

    this.brandForm.patchValue({ [field]: '' });
  }

  initForm(): void {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9\-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
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

  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.brandForm.reset({ isActive: true, isFeatured: false });
    this.currentStep.set(1);
    this.viewMode.set('create');

    // Очищаем списки мусора при открытии создания
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
    this.originalLogoUrl = '';
    this.originalHeroUrl = '';
  }

  closeCreateMode(): void {
    this.cleanupTempFiles(); // 👈 Вычищаем всё, что успели загрузить
    this.viewMode.set('list');
  }

  editBrand(brand: BrandListDto): void {
    this.loading.set(true);

    this.brandService.getBrandBySlug(brand.slug).subscribe({
      next: (fullBrand) => {
        this.isEditing.set(true);
        this.editingId.set(fullBrand.id);

        // 👈 Запоминаем оригинальные картинки
        this.originalLogoUrl = fullBrand.logoUrl || '';
        this.originalHeroUrl = fullBrand.heroImageUrl || '';
        this.tempUploadedFiles = [];
        this.filesToDeleteOnSave = [];

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
        this.viewMode.set('create');
        this.loading.set(false);
      },
      error: () => {
        alert('Не удалось загрузить данные бренда');
        this.loading.set(false);
      }
    });
  }

  // 🚀 ОБНОВЛЕННАЯ ЛОГИКА СОХРАНЕНИЯ (Срабатывает Окончательное Удаление)
  saveBrand(): void {
    if (this.brandForm.invalid) {
      alert('Проверьте правильность заполнения всех обязательных полей.');
      return;
    }

    this.loading.set(true);
    const dto = this.brandForm.value;

    if (this.isEditing() && this.editingId()) {
      this.brandService.updateBrand(this.editingId()!, dto).subscribe({
        next: () => this.onSaveSuccess(),
        error: () => { alert('Ошибка при обновлении'); this.loading.set(false); }
      });
    } else {
      this.brandService.createBrand(dto).subscribe({
        next: () => this.onSaveSuccess(),
        error: () => { alert('Ошибка при сохранении'); this.loading.set(false); }
      });
    }
  }

  private onSaveSuccess(): void {
    // Пользователь нажал "Сохранить" -> Удаляем старые оригиналы с сервера (если мы их заменяли/удаляли)
    this.filesToDeleteOnSave.forEach(url => this.fileService.deleteImage(url).subscribe());

    // Временные файлы становятся постоянными (спасаем от сборщика мусора)
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];

    this.loadBrands();
    this.viewMode.set('list');
  }

  /* ... МЕТОДЫ loadBrands, onSearchChange, toggleSort, toggleActive, toggleFeatured, deleteBrand, slugify - ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ ИЗ ТВОЕГО КОДА ... */

  loadBrands(): void {
    if (this.pageNumber() === 1) this.loading.set(true);
    else this.isLoadingMore.set(true);

    this.brandService.getBrands(
      this.pageNumber(),
      this.pageSize(),
      this.searchQuery(),
      this.currentSort()
    ).subscribe({
      next: (res) => {
        if (this.pageNumber() === 1) this.brands.set(res.items);
        else this.brands.update(prev => [...prev, ...res.items]);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.isLoadingMore.set(false); }
    });
  }

  resetAndLoad(): void { this.pageNumber.set(1); this.loadBrands(); }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.searchQuery.set(value); this.resetAndLoad(); }, 500);
  }

  toggleSort(column: 'name' | 'featured' | 'status' | 'count'): void {
    const current = this.currentSort();
    let nextSort = 'name_asc';
    if (column === 'name') nextSort = current === 'name_asc' ? 'name_desc' : 'name_asc';
    else if (column === 'featured') nextSort = current === 'featured_desc' ? 'featured_asc' : 'featured_desc';
    else if (column === 'status') nextSort = current === 'status_desc' ? 'status_asc' : 'status_desc';
    else if (column === 'count') nextSort = current === 'count_desc' ? 'count_asc' : 'count_desc';

    this.currentSort.set(nextSort);
    this.resetAndLoad();
  }

  onTableScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      if (!this.loading() && !this.isLoadingMore() && this.brands().length < this.totalCount()) {
        this.pageNumber.update(p => p + 1);
        this.loadBrands();
      }
    }
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
    return newSlug.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  toggleActive(brand: any): void {
    const originalStatus = brand.isActive;
    brand.isActive = !brand.isActive;
    this.brandService.toggleActiveStatus(brand.id).subscribe({
      error: () => { brand.isActive = originalStatus; alert('Не удалось изменить статус'); }
    });
  }

  toggleFeatured(brand: any): void {
    const originalStatus = brand.isFeatured;
    brand.isFeatured = !brand.isFeatured;
    this.brandService.toggleFeaturedStatus(brand.id).subscribe({
      error: () => { brand.isFeatured = originalStatus; alert('Не удалось изменить статус'); }
    });
  }

  deleteBrand(id: number, name: string): void {
    if (confirm(`Вы уверены, что хотите удалить бренд "${name}"?`)) {
      this.loading.set(true);
      this.brandService.deleteBrand(id).subscribe({
        next: () => this.loadBrands(),
        error: () => { alert('Ошибка при удалении'); this.loading.set(false); }
      });
    }
  }

  isStep1Valid(): boolean {
    const f = this.brandForm.controls;
    return f['name'].valid && f['slug'].valid && f['description'].valid;
  }

  nextStep(): void { if (this.currentStep() === 1 && this.isStep1Valid()) this.currentStep.set(2); }
  prevStep(): void { if (this.currentStep() > 1) this.currentStep.set(1); }
}
