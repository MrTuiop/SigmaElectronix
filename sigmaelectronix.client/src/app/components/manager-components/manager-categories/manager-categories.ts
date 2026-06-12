import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category-service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto, CategoryTreeDto } from '../../../models/category-models';
import {
  LucideFolderTree, LucidePlus, LucideTrash2, LucideEdit2,
  LucideChevronRight, LucideChevronDown, LucideSave, LucideX,
  LucideImage, LucideFolder, LucideCheck
} from '@lucide/angular';

@Component({
  selector: 'app-manager-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideFolderTree, LucidePlus, LucideTrash2, LucideEdit2,
    LucideChevronRight, LucideChevronDown, LucideSave, LucideX,
    LucideImage, LucideFolder, LucideCheck
  ],
  templateUrl: './manager-categories.html',
  styleUrl: './manager-categories.css'
})
export class ManagerCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  // Сигналы с данными (берем напрямую из кэша сервиса)
  categoryTree = this.categoryService.categoryTree;
  allCategories = this.categoryService.allCategories;

  loading = signal(false);

  // UI состояния
  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  // Храним ID раскрытых папок в дереве
  expandedNodes = signal<Set<number>>(new Set<number>());

  categoryForm!: FormGroup;

  // --- Состояния для умного селекта родительской категории ---
  parentSearch = signal('');
  isParentDropdownOpen = signal(false);
  selectedParentDisplay = signal('');

  // Вычисляем доступных родителей для выпадающего списка
  filteredParents = computed(() => {
    const search = this.parentSearch().toLowerCase().trim();
    // Исключаем саму категорию (чтобы она не могла стать родителем самой себе)
    const available = this.allCategories().filter(c => c.id !== this.editingId());

    let options = available.map(cat => {
      let pathNames: string[] = [];
      let current: any = cat;
      while (current) {
        pathNames.unshift(current.name);
        current = available.find(c => c.id === current.parentCategoryId);
      }
      return { id: cat.id, displayPath: pathNames.join(' → ') };
    });

    if (search) {
      options = options.filter(o => o.displayPath.toLowerCase().includes(search));
    }
    return options.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
  });

  ngOnInit(): void {
    this.loadData();
    this.initForm();
  }

  loadData(): void {
    this.loading.set(true);
    this.categoryService.loadTree().subscribe();
    this.categoryService.loadAll().subscribe({
      next: () => {
        const rootIds = this.categoryTree().map(c => c.id);
        this.expandedNodes.set(new Set(rootIds));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9\-_]+$/)]],
      imageUrl: [''],
      parentCategoryId: [null]
    });

    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditing()) {
        const generatedSlug = this.slugify(name);
        this.categoryForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
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
    return newSlug.replace(/[^a-z0-9\-_]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }

  toggleNode(id: number): void {
    const current = new Set(this.expandedNodes());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedNodes.set(current);
  }

  isNodeExpanded(id: number): boolean {
    return this.expandedNodes().has(id);
  }

  // --- Методы для поиска родительской категории ---
  openParentSearch(): void {
    this.isParentDropdownOpen.set(true);
    this.parentSearch.set('');
  }

  closeParentSearch(): void {
    setTimeout(() => this.isParentDropdownOpen.set(false), 200);
  }

  onParentSearch(event: Event): void {
    this.parentSearch.set((event.target as HTMLInputElement).value);
    this.isParentDropdownOpen.set(true);
  }

  selectParent(id: number | null, path: string): void {
    this.categoryForm.patchValue({ parentCategoryId: id });
    this.selectedParentDisplay.set(path);
    this.isParentDropdownOpen.set(false);
  }

  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.categoryForm.reset();
    this.selectedParentDisplay.set('Без родителя (Корневая)');
    this.viewMode.set('form');
  }

  openEditMode(category: CategoryDto | CategoryTreeDto): void {
    this.isEditing.set(true);
    this.editingId.set(category.id);

    const fullCategory = this.allCategories().find(c => c.id === category.id);

    this.categoryForm.patchValue({
      name: fullCategory?.name || category.name,
      slug: fullCategory?.slug || category.slug,
      imageUrl: fullCategory?.imageUrl || category.imageUrl,
      parentCategoryId: fullCategory?.parentCategoryId || null
    });

    // Находим путь родителя для отображения в селекте
    if (fullCategory?.parentCategoryId) {
      const parent = this.filteredParents().find(p => p.id === fullCategory.parentCategoryId);
      this.selectedParentDisplay.set(parent ? parent.displayPath : '');
    } else {
      this.selectedParentDisplay.set('Без родителя (Корневая)');
    }

    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.loading.set(true);

    if (this.isEditing() && this.editingId()) {
      const dto: UpdateCategoryDto = this.categoryForm.value;
      this.categoryService.update(this.editingId()!, dto).subscribe({
        next: () => {
          this.loadData();
          this.closeForm();
        },
        error: (err) => {
          alert(err.error?.message || 'Ошибка обновления');
          this.loading.set(false);
        }
      });
    } else {
      const dto: CreateCategoryDto = this.categoryForm.value;
      this.categoryService.create(dto).subscribe({
        next: () => {
          this.loadData();
          this.closeForm();
        },
        error: (err) => {
          alert(err.error?.message || 'Ошибка создания');
          this.loading.set(false);
        }
      });
    }
  }

  deleteCategory(id: number, name: string): void {
    if (confirm(`Удалить категорию "${name}"?\nВсе товары должны быть предварительно удалены или перенесены.`)) {
      this.loading.set(true);
      this.categoryService.delete(id).subscribe({
        next: () => this.loadData(),
        error: (err) => {
          alert(err.error?.message || 'Невозможно удалить категорию. Возможно, в ней есть товары.');
          this.loading.set(false);
        }
      });
    }
  }
}
