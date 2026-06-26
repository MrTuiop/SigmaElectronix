import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageService } from '../../../services/language-service';
import { LanguageDto, CreateUpdateLanguageDto } from '../../../models/language-models';
import { HttpEventType } from '@angular/common/http';
import {
  LucideGlobe, LucidePlus, LucideTrash2, LucideEdit2,
  LucideEye, LucideEyeOff, LucideArrowLeft, LucideCheck,
  LucideChevronDown, LucideChevronUp, LucideSearch, LucideX,
  LucideStar, LucideUploadCloud, LucideLanguages
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { FileService } from '../../../services/file-service';
import { ToastService } from '../../../services/toast';
import { ConfirmModalComponent } from '../../shared-components/confirm-modal/confirm-modal'; // <-- ДОБАВИЛИ

@Component({
  selector: 'app-manager-languages',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    LucideGlobe, LucidePlus, LucideTrash2, LucideEdit2,
    LucideEye, LucideEyeOff, LucideArrowLeft, LucideCheck,
    LucideChevronDown, LucideChevronUp, LucideSearch, LucideX,
    LucideStar, LucideUploadCloud, LucideLanguages,
    SpinnerComponent,
    ConfirmModalComponent // <-- ДОБАВИЛИ
  ],
  templateUrl: './manager-languages.html',
  styleUrl: './manager-languages.css'
})
export class ManagerLanguagesComponent implements OnInit, OnDestroy {
  private languageService = inject(LanguageService);
  private fileService = inject(FileService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  languages = signal<LanguageDto[]>([]);
  loading = signal(false);

  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingCode = signal<string | null>(null);

  languageForm!: FormGroup;

  searchQuery = signal('');
  currentSort = signal('name_asc');

  // Drag&Drop
  isUploadingIcon = signal(false);
  isDragoverIcon = signal(false);
  iconUploadProgress = signal(0);

  // --- Состояния для окна подтверждения удаления ---
  showConfirmModal = signal(false);
  languageToDelete = signal<LanguageDto | null>(null);

  // Сборщик мусора
  private tempUploadedFiles: string[] = [];
  private filesToDeleteOnSave: string[] = [];
  private originalIconUrl: string = '';

  filteredLanguages = computed(() => {
    let result = this.languages();
    const query = this.searchQuery().toLowerCase().trim();

    if (query) {
      result = result.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.nativeName.toLowerCase().includes(query) ||
        l.code.toLowerCase().includes(query)
      );
    }

    const sort = this.currentSort();
    result = [...result].sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'name_desc') return b.name.localeCompare(a.name);
      if (sort === 'code_asc') return a.code.localeCompare(b.code);
      if (sort === 'code_desc') return b.code.localeCompare(a.code);
      return 0;
    });

    return result.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
  });

  ngOnInit() {
    this.initForm();
    this.loadLanguages();
  }

  ngOnDestroy() {
    this.cleanupTempFiles();
  }

  loadLanguages() {
    this.loading.set(true);
    this.languageService.getAllLanguages(true).subscribe({
      next: (data) => {
        this.languages.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка загрузки языков');
        this.loading.set(false);
      }
    });
  }

  initForm() {
    this.languageForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[a-z0-9\-]+$/i)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      nativeName: ['', [Validators.required, Validators.maxLength(100)]],
      iconUrl: [''],
      isDefault: [false],
      isActive: [true]
    });
  }

  openCreateMode() {
    this.isEditing.set(false);
    this.editingCode.set(null);
    this.languageForm.reset({ isActive: true, isDefault: false });
    this.languageForm.get('code')?.enable();
    this.viewMode.set('form');

    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
    this.originalIconUrl = '';
  }

  editLanguage(lang: LanguageDto) {
    this.isEditing.set(true);
    this.editingCode.set(lang.code);

    this.originalIconUrl = lang.iconUrl || '';
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];

    this.languageForm.patchValue({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      iconUrl: lang.iconUrl || '',
      isDefault: lang.isDefault,
      isActive: lang.isActive
    });

    this.languageForm.get('code')?.disable();
    this.viewMode.set('form');
  }

  closeForm() {
    this.cleanupTempFiles();
    this.viewMode.set('list');
  }

  saveLanguage() {
    if (this.languageForm.invalid) {
      this.languageForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const dto: CreateUpdateLanguageDto = this.languageForm.getRawValue();

    if (this.isEditing() && this.editingCode()) {
      this.languageService.updateLanguage(this.editingCode()!, dto).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          this.toastService.error(err.error?.message || 'Ошибка обновления языка');
          this.loading.set(false);
        }
      });
    } else {
      this.languageService.createLanguage(dto).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          this.toastService.error(err.error?.message || 'Ошибка создания языка');
          this.loading.set(false);
        }
      });
    }
  }

  private onSaveSuccess() {
    this.filesToDeleteOnSave.forEach(url => this.fileService.deleteImage(url).subscribe());
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];

    this.toastService.success('Язык успешно сохранен');
    this.loadLanguages();
    this.viewMode.set('list');
  }

  toggleActive(lang: LanguageDto) {
    const origStatus = lang.isActive;
    const newStatus = !origStatus;

    this.languages.update(list =>
      list.map(l => l.code === lang.code ? { ...l, isActive: newStatus } : l)
    );

    this.languageService.toggleLanguageStatus(lang.code).subscribe({
      next: () => this.toastService.info(`Статус языка ${lang.code} изменен`),
      error: (err) => {
        this.languages.update(list =>
          list.map(l => l.code === lang.code ? { ...l, isActive: origStatus } : l)
        );
        this.toastService.error(err.error?.message || 'Ошибка изменения статуса');
      }
    });
  }

  setDefault(lang: LanguageDto) {
    if (lang.isDefault) return;

    const origDefault = this.languages().find(l => l.isDefault)?.code;

    this.languages.update(list => list.map(l => ({ ...l, isDefault: l.code === lang.code })));

    this.languageService.setLanguageAsDefault(lang.code).subscribe({
      next: () => this.toastService.success(`${lang.name} теперь основной язык`),
      error: (err) => {
        this.languages.update(list => list.map(l => ({ ...l, isDefault: l.code === origDefault })));
        this.toastService.error(err.error?.message || 'Ошибка изменения дефолтного языка');
      }
    });
  }

  onSearchChange(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  toggleSort(column: 'name' | 'code') {
    const curr = this.currentSort();
    if (column === 'name') this.currentSort.set(curr === 'name_asc' ? 'name_desc' : 'name_asc');
    else if (column === 'code') this.currentSort.set(curr === 'code_asc' ? 'code_desc' : 'code_asc');
  }

  onDragOver(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.isDragoverIcon.set(true); }
  onDragLeave(event: DragEvent) { event.preventDefault(); event.stopPropagation(); this.isDragoverIcon.set(false); }
  onDrop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation(); this.isDragoverIcon.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFileUpload(file);
  }
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFileUpload(file);
  }

  private handleFileUpload(file: File) {
    this.isUploadingIcon.set(true);
    this.iconUploadProgress.set(0);

    this.fileService.uploadImageWithProgress(file, 'flags').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.iconUploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          const res = event.body;
          if (res?.url) {
            const prevUrl = this.languageForm.get('iconUrl')?.value;
            if (prevUrl) {
              if (this.tempUploadedFiles.includes(prevUrl)) {
                this.fileService.deleteImage(prevUrl).subscribe();
                this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== prevUrl);
              } else if (prevUrl === this.originalIconUrl) {
                this.filesToDeleteOnSave.push(prevUrl);
              }
            }

            this.languageForm.patchValue({ iconUrl: res.url });
            this.tempUploadedFiles.push(res.url);
            this.isUploadingIcon.set(false);
          }
        }
      },
      error: () => {
        this.toastService.error('Ошибка загрузки иконки');
        this.isUploadingIcon.set(false);
      }
    });
  }

  removeImage() {
    const currentUrl = this.languageForm.get('iconUrl')?.value;
    if (!currentUrl) return;

    if (this.tempUploadedFiles.includes(currentUrl)) {
      this.fileService.deleteImage(currentUrl).subscribe();
      this.tempUploadedFiles = this.tempUploadedFiles.filter(u => u !== currentUrl);
    } else if (currentUrl === this.originalIconUrl) {
      this.filesToDeleteOnSave.push(currentUrl);
    }
    this.languageForm.patchValue({ iconUrl: '' });
  }

  private cleanupTempFiles() {
    this.tempUploadedFiles.forEach(url => this.fileService.deleteImage(url).subscribe());
    this.tempUploadedFiles = [];
    this.filesToDeleteOnSave = [];
  }

  // --- НОВАЯ ЛОГИКА УДАЛЕНИЯ ---
  deleteLanguage(lang: LanguageDto) {
    this.languageToDelete.set(lang);
    this.showConfirmModal.set(true);
  }

  confirmDelete(): void {
    const lang = this.languageToDelete();
    if (!lang) return;

    this.showConfirmModal.set(false);
    this.loading.set(true);

    this.languageService.deleteLanguage(lang.code).subscribe({
      next: () => {
        this.toastService.success(`Язык "${lang.name}" успешно удален`);
        this.loadLanguages();
        this.languageToDelete.set(null);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Ошибка при удалении языка');
        this.loading.set(false);
        this.languageToDelete.set(null);
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.languageToDelete.set(null);
  }
}
