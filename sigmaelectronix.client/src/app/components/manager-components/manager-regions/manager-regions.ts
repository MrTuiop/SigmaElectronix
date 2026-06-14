import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegionDto, CreateUpdateRegionDto } from '../../../models/location-models';
import {
  LucideGlobe, LucidePlus, LucideEdit2, LucideTrash2,
  LucideCheck, LucideSearch
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { RegionService } from '../../../services/region-service';

@Component({
  selector: 'app-manager-regions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideGlobe, LucidePlus, LucideEdit2, LucideTrash2,
    LucideCheck, LucideSearch,
    SpinnerComponent
  ],
  templateUrl: './manager-regions.html',
  styleUrl: './manager-regions.css'
})
export class ManagerRegionsComponent implements OnInit {
  private regionService = inject(RegionService);
  private fb = inject(FormBuilder);

  // Состояния
  regions = signal<RegionDto[]>([]);
  loading = signal(false);
  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  searchQuery = signal('');

  regionForm!: FormGroup;

  // Умный поиск (фильтрует мгновенно)
  filteredRegions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.regions();
    if (!query) return all;

    return all.filter(r =>
      r.name.toLowerCase().includes(query) ||
      (r.code && r.code.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.initForm();
    this.loadRegions();
  }

  initForm(): void {
    this.regionForm = this.fb.group({
      name: ['', Validators.required],
      code: [''] // Код не обязателен
    });
  }

  loadRegions(): void {
    this.loading.set(true);
    this.regionService.getAll().subscribe({
      next: (data) => {
        this.regions.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // --- Навигация ---
  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.regionForm.reset();
    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  // --- Редактирование ---
  editRegion(region: RegionDto): void {
    this.isEditing.set(true);
    this.editingId.set(region.id);

    this.regionForm.patchValue({
      name: region.name,
      code: region.code
    });

    this.viewMode.set('form');
  }

  // --- Сохранение ---
  saveRegion(): void {
    if (this.regionForm.invalid) {
      this.regionForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload: CreateUpdateRegionDto = this.regionForm.value;

    if (this.isEditing() && this.editingId()) {
      this.regionService.update(this.editingId()!, payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          alert(err.error?.message || 'Ошибка при обновлении региона');
          this.loading.set(false);
        }
      });
    } else {
      this.regionService.create(payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err) => {
          alert(err.error?.message || 'Ошибка при создании региона');
          this.loading.set(false);
        }
      });
    }
  }

  private onSaveSuccess(): void {
    this.loadRegions();
    this.viewMode.set('list');
  }

  // --- Удаление ---
  deleteRegion(id: number, name: string): void {
    if (confirm(`Вы уверены, что хотите удалить регион "${name}"?`)) {
      this.loading.set(true);
      this.regionService.delete(id).subscribe({
        next: () => this.loadRegions(),
        error: (err) => {
          alert(err.error?.message || 'Невозможно удалить регион. Убедитесь, что в нем нет городов.');
          this.loading.set(false);
        }
      });
    }
  }
}
