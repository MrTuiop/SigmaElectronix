import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrandService } from '../../../services/brand-service';
import { BrandListDto, CreateBrandDto } from '../../../models/brand-models';
import {
  LucideAward, LucidePlus, LucideTrash2, LucideEdit2,
  LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
  LucideCheck, LucideChevronLeft, LucideChevronRight, LucideSparkles
} from '@lucide/angular';

@Component({
  selector: 'app-manager-brands',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAward, LucidePlus, LucideTrash2, LucideEdit2,
    LucideEye, LucideEyeOff, LucideArrowRight, LucideArrowLeft,
    LucideCheck, LucideChevronLeft, LucideChevronRight, LucideSparkles
  ],
  templateUrl: './manager-brands.html',
  styleUrl: './manager-brands.css'
})
export class ManagerBrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  private fb = inject(FormBuilder);

  // Состояния списков
  brands = signal<BrandListDto[]>([]);
  pageNumber = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);
  loading = signal(false);

  // Состояния UI режима
  viewMode = signal<'list' | 'create'>('list');
  currentStep = signal(1); // Текущий шаг формы контент-мастера (1, 2 или 3)
  brandForm!: FormGroup;

  ngOnInit(): void {
    this.loadBrands();
    this.initForm();
  }

  loadBrands(): void {
    this.loading.set(true);
    this.brandService.getBrands(this.pageNumber(), this.pageSize()).subscribe({
      next: (res) => {
        this.brands.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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
      seoTitle: [''],
      seoDescription: [''],
      seoKeywords: [''],
      isFeatured: [false],
      isActive: [true],
      sortOrder: [0]
    });

    // Автоматическая генерация slug при изменении имени
    this.brandForm.get('name')?.valueChanges.subscribe(name => {
      if (name) {
        const generatedSlug = this.slugify(name);
        this.brandForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });
  }

  // Хелпер транслитерации для автоматического заполнения URL (slug)
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
      .replace(/[^a-z0-9\s-]/g, '') // убираем недопустимые символы
      .replace(/\s+/g, '-')         // пробелы в дефисы
      .replace(/-+/g, '-');         // двойные дефисы в один
  }

  openCreateMode(): void {
    this.brandForm.reset({ isActive: true, isFeatured: false, sortOrder: 0 });
    this.currentStep.set(1);
    this.viewMode.set('create');
  }

  closeCreateMode(): void {
    this.viewMode.set('list');
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  saveBrand(): void {
    if (this.brandForm.invalid) return;

    this.loading.set(true);
    const dto: CreateBrandDto = this.brandForm.value;

    this.brandService.createBrand(dto).subscribe({
      next: () => {
        this.loadBrands();
        this.viewMode.set('list');
      },
      error: () => this.loading.set(false)
    });
  }

  deleteBrand(id: number, name: string): void {
    if (confirm(`Вы уверены, что хотите удалить бренд "${name}"?`)) {
      this.brandService.deleteBrand(id).subscribe({
        next: () => this.loadBrands()
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
