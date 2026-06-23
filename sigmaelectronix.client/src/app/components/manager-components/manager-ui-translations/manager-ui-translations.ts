import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { ConfirmModalComponent } from '../../shared-components/confirm-modal/confirm-modal'; // 👈 Импорт модалки
import {
  LucideLanguages, LucidePlus, LucideEdit2, LucideTrash2,
  LucideCheck, LucideSearch, LucideX, LucideGlobe,
  LucideChevronDown
} from '@lucide/angular';
import { UiTranslationService } from '../../../services/ui-translation-service';
import { LanguageService } from '../../../services/language-service';
import { CreateUpdateUiTranslationDto, UiTranslationDto } from '../../../models/ui-translation-models';
import { LanguageDto } from '../../../models/language-models';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-manager-ui-translations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideLanguages, LucidePlus, LucideEdit2, LucideTrash2,
    LucideCheck, LucideSearch, LucideX, LucideGlobe, LucideChevronDown,
    SpinnerComponent,
    ConfirmModalComponent // 👈 Добавляем в imports
  ],
  templateUrl: './manager-ui-translations.html',
  styleUrl: './manager-ui-translations.css'
})
export class ManagerUiTranslationsComponent implements OnInit {
  private translationService = inject(UiTranslationService);
  private languageService = inject(LanguageService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  // --- Состояния ---
  translations = signal<UiTranslationDto[]>([]);
  languages = signal<LanguageDto[]>([]);
  loading = signal(false);

  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  searchQuery = signal('');
  selectedLangFilter = signal<string>('ALL');

  translationForm!: FormGroup;

  // --- Состояния для умного списка ключей ---
  keySearch = signal('');
  isKeyDropdownOpen = signal(false);

  // 🚀 НОВОЕ: Состояния для окна подтверждения удаления
  showConfirmModal = signal(false);
  translationToDelete = signal<{ id: number, key: string, lang: string } | null>(null);

  uniqueKeys = computed(() => {
    const keys = new Set(this.translations().map(t => t.key.toUpperCase()));
    return Array.from(keys).sort();
  });

  filteredKeys = computed(() => {
    const query = this.keySearch().toUpperCase().trim();
    if (!query) return this.uniqueKeys();
    return this.uniqueKeys().filter(k => k.includes(query));
  });

  filteredTranslations = computed(() => {
    let result = this.translations();
    const query = this.searchQuery().toLowerCase().trim();
    const lang = this.selectedLangFilter();

    if (lang !== 'ALL') {
      result = result.filter(t => t.languageCode === lang);
    }

    if (query) {
      result = result.filter(t =>
        t.key.toLowerCase().includes(query) ||
        t.value.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const keyCmp = a.key.localeCompare(b.key);
      if (keyCmp !== 0) return keyCmp;
      return a.languageCode.localeCompare(b.languageCode);
    });
  });

  ngOnInit(): void {
    this.initForm();
    this.loadLanguages();
    this.loadTranslations();
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages(false).subscribe({
      next: (langs) => this.languages.set(langs)
    });
  }

  initForm(): void {
    this.translationForm = this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_]+$/)]],
      languageCode: ['ru', [Validators.required, Validators.maxLength(5)]],
      value: ['', Validators.required]
    });
  }

  loadTranslations(): void {
    this.loading.set(true);
    this.translationService.getAll().subscribe({
      next: (data) => {
        this.translations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка при загрузке переводов');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  setLangFilter(code: string): void {
    this.selectedLangFilter.set(code);
  }

  selectFormLanguage(code: string): void {
    this.translationForm.patchValue({ languageCode: code });
  }

  onKeyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.toUpperCase();

    input.value = val;
    this.translationForm.patchValue({ key: val }, { emitEvent: false });

    this.keySearch.set(val);
    this.isKeyDropdownOpen.set(true);
  }

  openKeySearch(): void {
    const currentKey = this.translationForm.get('key')?.value || '';
    this.keySearch.set(currentKey.toUpperCase());
    this.isKeyDropdownOpen.set(true);
  }

  closeKeySearch(): void {
    setTimeout(() => this.isKeyDropdownOpen.set(false), 200);
  }

  selectKey(key: string): void {
    const upperKey = key.toUpperCase();
    this.translationForm.patchValue({ key: upperKey });
    this.keySearch.set(upperKey);
    this.isKeyDropdownOpen.set(false);
  }

  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.translationForm.reset({ languageCode: 'ru' });
    this.keySearch.set('');
    this.viewMode.set('form');
  }

  editTranslation(item: UiTranslationDto): void {
    this.isEditing.set(true);
    this.editingId.set(item.id);

    const upperKey = item.key.toUpperCase();
    this.keySearch.set(upperKey);

    this.translationForm.patchValue({
      key: upperKey,
      languageCode: item.languageCode,
      value: item.value
    });

    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  saveTranslation(): void {
    if (this.translationForm.invalid) {
      this.translationForm.markAllAsTouched();
      this.toastService.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    this.loading.set(true);
    const payload: CreateUpdateUiTranslationDto = this.translationForm.value;

    payload.key = payload.key.trim().toUpperCase();
    payload.languageCode = payload.languageCode.trim().toLowerCase();

    if (this.isEditing() && this.editingId()) {
      this.translationService.update(this.editingId()!, payload).subscribe({
        next: () => {
          this.toastService.success('Перевод успешно обновлен!');
          this.onSaveSuccess();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Ошибка обновления перевода');
          this.loading.set(false);
        }
      });
    } else {
      this.translationService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Новый перевод успешно добавлен!');
          this.onSaveSuccess();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Ошибка создания перевода');
          this.loading.set(false);
        }
      });
    }
  }

  private onSaveSuccess(): void {
    this.loadTranslations();
    this.viewMode.set('list');
  }

  // 🚀 НОВОЕ: Открытие модалки вместо alert
  deleteTranslation(id: number, key: string, lang: string): void {
    this.translationToDelete.set({ id, key, lang });
    this.showConfirmModal.set(true);
  }

  // 🚀 НОВОЕ: Подтверждение удаления
  confirmDelete(): void {
    const target = this.translationToDelete();
    if (!target) return;

    this.showConfirmModal.set(false);
    this.loading.set(true);

    this.translationService.delete(target.id).subscribe({
      next: () => {
        this.toastService.success(`Перевод для "${target.key.toUpperCase()}" удален`);
        this.loadTranslations();
        this.translationToDelete.set(null);
      },
      error: () => {
        this.toastService.error('Ошибка при удалении перевода');
        this.loading.set(false);
        this.translationToDelete.set(null);
      }
    });
  }

  // 🚀 НОВОЕ: Отмена удаления
  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.translationToDelete.set(null);
  }
}
