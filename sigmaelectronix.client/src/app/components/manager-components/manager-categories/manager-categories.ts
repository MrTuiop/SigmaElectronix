import { Component, OnInit, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { CategoryService } from '../../../services/category-service';
import { FileService } from '../../../services/file-service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto, CategoryTreeDto } from '../../../models/category-models';
import {
  LucideFolderTree, LucidePlus, LucideTrash2, LucideEdit2,
  LucideChevronRight, LucideChevronDown, LucideSave, LucideX,
  LucideImage, LucideFolder, LucideCheck,
  LucideSmartphone, LucideLaptop, LucideHeadphones,
  LucideWatch, LucideTv, LucideGamepad2,
  LucideMonitor, LucideCamera,
  LucideGlobe // 👈 Подключили иконку глобуса
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

@Component({
  selector: 'app-manager-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideFolderTree, LucidePlus, LucideTrash2, LucideEdit2,
    LucideChevronRight, LucideChevronDown, LucideSave, LucideX,
    LucideImage, LucideFolder, LucideCheck,
    LucideGlobe, // 👈 Добавили в imports
    SpinnerComponent
  ],
  templateUrl: './manager-categories.html',
  styleUrl: './manager-categories.css'
})
export class ManagerCategoriesComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private fileService = inject(FileService);
  private fb = inject(FormBuilder);

  categoryTree = this.categoryService.categoryTree;
  allCategories = this.categoryService.allCategories;
  loading = signal(false);

  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  expandedNodes = signal<Set<number>>(new Set<number>());

  categoryForm!: FormGroup;

  parentSearch = signal('');
  isParentDropdownOpen = signal(false);
  selectedParentDisplay = signal('');

  // СОСТОЯНИЯ ЗАГРУЗКИ И DRAG&DROP
  isUploadingImage = signal(false);
  isDragoverImage = signal(false);
  imageUploadProgress = signal(0);

  // СБОРЩИК МУСОРА
  private tempUploadedFiles: string[] = [];      // Временные файлы
  private filesToDeleteOnSave: string[] = [];    // Оригиналы, которые нужно снести при сохранении
  private originalImageUrl: string = '';         // Запомненный оригинал

  filteredParents = computed(() => {
    const search = this.parentSearch().toLowerCase().trim();
    const all = this.allCategories();
    const available = all.filter(c => c.id !== this.editingId());

    let options = available.map(cat => {
      let pathNames: string[] = [];
      let current: any = cat;
      let hasEditedItemInPath = false;

      while (current) {
        pathNames.unshift(current.name);
        if (this.editingId() && current.parentCategoryId === this.editingId()) {
          hasEditedItemInPath = true;
        }
        current = all.find(c => c.id === current.parentCategoryId);
      }
      return {
        id: cat.id,
        displayPath: pathNames.join(' → '),
        level: pathNames.length,
        hasEditedItemInPath
      };
    });

    options = options.filter(o => o.level < 3 && !o.hasEditedItemInPath);

    if (search) {
      options = options.filter(o => o.displayPath.toLowerCase().includes(search));
    }
    return options.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
  });

  ngOnInit(): void {
    this.loadData();
    this.initForm();
  }

  ngOnDestroy(): void {
    this.cleanupTempFiles();
  }

  private cleanupTempFiles(): void {
    this.tempUploadedFiles.forEach(url => {
      this.fileService.deleteImage(url).subscribe();
    });
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
  }

  loadData(): void {
    this.loading.set(true);
    this.categoryService.loadTreeForAdmin().subscribe();
    this.categoryService.loadAllForAdmin().subscribe({
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
      icon: ['folder'],
      parentCategoryId: [null]
    });

    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditing()) {
        const generatedSlug = this.slugify(name);
        this.categoryForm.get('slug')?.setValue(generatedSlug, { emitEvent: false });
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragoverImage.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragoverImage.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragoverImage.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFileUpload(file);
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFileUpload(file);
  }

  private handleFileUpload(file: File): void {
    this.isUploadingImage.set(true);
    this.imageUploadProgress.set(0);

    this.fileService.uploadImageWithProgress(file, 'categories').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.imageUploadProgress.set(Math.round(100 * event.loaded / event.total));
        }
        else if (event.type === HttpEventType.Response) {
          const res = event.body;
          if (res?.url) {
            const prevUrl = this.categoryForm.get('imageUrl')?.value;

            if (prevUrl) {
              if (this.tempUploadedFiles.includes(prevUrl)) {
                this.fileService.deleteImage(prevUrl).subscribe();
                this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== prevUrl);
              } else if (prevUrl === this.originalImageUrl) {
                this.filesToDeleteOnSave.push(prevUrl);
              }
            }

            this.categoryForm.patchValue({ imageUrl: res.url });
            this.tempUploadedFiles.push(res.url);
            this.isUploadingImage.set(false);
          }
        }
      },
      error: () => {
        alert('Ошибка при загрузке картинки');
        this.isUploadingImage.set(false);
      }
    });
  }

  removeImage(): void {
    const currentUrl = this.categoryForm.get('imageUrl')?.value;
    if (!currentUrl) return;

    if (this.tempUploadedFiles.includes(currentUrl)) {
      this.fileService.deleteImage(currentUrl).subscribe();
      this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== currentUrl);
    } else if (currentUrl === this.originalImageUrl) {
      this.filesToDeleteOnSave.push(currentUrl);
    }

    this.categoryForm.patchValue({ imageUrl: '' });
  }

  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.categoryForm.reset({ icon: 'folder' });
    this.selectedParentDisplay.set('Без родителя (Корневая)');
    this.viewMode.set('form');

    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
    this.originalImageUrl = '';
  }

  openEditMode(category: CategoryDto | CategoryTreeDto): void {
    this.isEditing.set(true);
    this.editingId.set(category.id);

    this.loading.set(true);

    this.categoryService.getByIdForAdmin(category.id).subscribe({
      next: (fullCategory) => {
        if (!fullCategory) {
          alert('Категория не найдена');
          this.loading.set(false);
          this.isEditing.set(false);
          return;
        }

        this.originalImageUrl = fullCategory.imageUrl || '';
        this.tempUploadedFiles = [];
        this.filesToDeleteOnSave = [];

        this.categoryForm.patchValue({
          name: fullCategory.name,
          slug: fullCategory.slug,
          imageUrl: this.originalImageUrl,
          icon: fullCategory.icon || 'folder',
          parentCategoryId: fullCategory.parentCategoryId || null
        });

        if (fullCategory.parentCategoryId) {
          const parent = this.filteredParents().find(p => p.id === fullCategory.parentCategoryId);
          this.selectedParentDisplay.set(parent ? parent.displayPath : '');
        } else {
          this.selectedParentDisplay.set('Без родителя (Корневая)');
        }

        this.viewMode.set('form');
        this.loading.set(false);
      },
      error: () => {
        alert('Не удалось загрузить данные категории');
        this.loading.set(false);
        this.isEditing.set(false);
      }
    });
  }

  closeForm(): void {
    this.cleanupTempFiles();
    this.viewMode.set('list');
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.loading.set(true);
    const formValue = this.categoryForm.value;

    const payload = {
      imageUrl: formValue.imageUrl || null,
      icon: formValue.icon || 'folder',
      parentCategoryId: formValue.parentCategoryId || null,
      translations: [
        {
          languageCode: 'ru',
          name: formValue.name,
          slug: formValue.slug
        }
      ]
    };

    if (this.isEditing() && this.editingId()) {
      this.categoryService.update(this.editingId()!, payload as UpdateCategoryDto).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          alert(err.error?.message || 'Ошибка обновления');
          this.loading.set(false);
        }
      });
    } else {
      this.categoryService.create(payload as CreateCategoryDto).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          alert(err.error?.message || 'Ошибка создания');
          this.loading.set(false);
        }
      });
    }
  }

  private onSaveSuccess(): void {
    this.filesToDeleteOnSave.forEach(url => this.fileService.deleteImage(url).subscribe());

    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];

    this.loadData();
    this.closeForm();
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
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.expandedNodes.set(current);
  }

  isNodeExpanded(id: number): boolean {
    return this.expandedNodes().has(id);
  }

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

  availableIcons: Array<{ id: string, name: string, component: any }> = [
    { id: 'smartphone', name: 'Смартфоны', component: LucideSmartphone },
    { id: 'laptop', name: 'Ноутбуки', component: LucideLaptop },
    { id: 'headphones', name: 'Аудио', component: LucideHeadphones },
    { id: 'watch', name: 'Часы', component: LucideWatch },
    { id: 'tv', name: 'Телевизоры', component: LucideTv },
    { id: 'gamepad-2', name: 'Игры', component: LucideGamepad2 },
    { id: 'monitor', name: 'Мониторы', component: LucideMonitor },
    { id: 'camera', name: 'Фото', component: LucideCamera },
    { id: 'folder', name: 'Папка (по умолч.)', component: LucideFolder }
  ];

  isIconDropdownOpen = signal(false);

  selectedIconDisplay = computed(() => {
    const iconId = this.categoryForm?.get('icon')?.value || 'folder';
    return this.availableIcons.find(i => i.id === iconId) || this.availableIcons.find(i => i.id === 'folder');
  });

  toggleIconDropdown() {
    this.isIconDropdownOpen.update(v => !v);
  }

  selectIcon(iconId: string) {
    this.categoryForm.patchValue({ icon: iconId });
    this.isIconDropdownOpen.set(false);
  }

  getIconComponent(iconId: string | undefined): any {
    if (!iconId) return LucideFolder;
    const icon = this.availableIcons.find(i => i.id === iconId);
    return icon ? icon.component : LucideFolder;
  }

  getSelectedIconLabel(): string {
    const selectedId = this.categoryForm.get('icon')?.value;
    if (!selectedId) return 'Выберите иконку...';
    const icon = this.availableIcons.find(i => i.id === selectedId);
    return icon ? icon.name : 'Выберите иконку...';
  }
}
