import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CouponService } from '../../../services/coupon-service'; // Убедись, что путь правильный
import { CouponDto, CreateUpdateCouponDto } from '../../../models/coupon-models'; // Путь к моделям
import {
  LucideTicket,
  LucidePlus,
  LucideSearch,
  LucideEdit2,
  LucideTrash2,
  LucideCheck,
  LucideX,
  LucideEye,
  LucideEyeOff,
  LucidePercent,
  LucideBanknote
} from '@lucide/angular';

@Component({
  selector: 'app-manager-coupons',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideTicket,
    LucidePlus,
    LucideSearch,
    LucideEdit2,
    LucideTrash2,
    LucideCheck,
    LucideX,
    LucideEye,
    LucideEyeOff,
    LucidePercent,
    LucideBanknote
  ],
  providers: [DatePipe],
  templateUrl: './manager-coupons.html',
  styleUrl: './manager-coupons.css'
})
export class ManagerCouponsComponent implements OnInit {
  private couponService = inject(CouponService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  // --- Состояния ---
  coupons = signal<CouponDto[]>([]);
  loading = signal(false);
  viewMode = signal<'list' | 'form'>('list');
  editingId = signal<number | null>(null);
  searchQuery = signal('');

  couponForm!: FormGroup;

  // Умный поиск с помощью вычисляемого сигнала
  filteredCoupons = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.coupons();

    return this.coupons().filter(c =>
      c.code.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    this.initForm();
    this.loadCoupons();
  }

  initForm(): void {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      discountValue: [0, [Validators.required, Validators.min(1)]],
      isPercentage: [false],
      minOrderAmount: [0, [Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      maxUsageCount: [100, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  loadCoupons(): void {
    this.loading.set(true);
    this.couponService.getAllCoupons().subscribe({
      next: (res) => {
        this.coupons.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки купонов', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openCreateMode(): void {
    this.editingId.set(null);
    this.couponForm.reset({
      isPercentage: false,
      minOrderAmount: 0,
      maxUsageCount: 100,
      isActive: true,
      startDate: this.formatDateForInput(new Date()),
      endDate: this.formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 1))) // +1 месяц по умолчанию
    });
    this.viewMode.set('form');
  }

  editCoupon(coupon: CouponDto): void {
    this.editingId.set(coupon.id);
    this.couponForm.patchValue({
      code: coupon.code,
      description: coupon.description,
      discountValue: coupon.discountValue,
      isPercentage: coupon.isPercentage,
      minOrderAmount: coupon.minOrderAmount,
      maxUsageCount: coupon.maxUsageCount,
      isActive: coupon.isActive,
      startDate: this.formatDateForInput(new Date(coupon.startDate)),
      endDate: this.formatDateForInput(new Date(coupon.endDate))
    });
    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
    this.editingId.set(null);
  }

  saveCoupon(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.couponForm.value;

    // Преобразуем даты обратно в ISO (если требуется бэкендом)
    const dto: CreateUpdateCouponDto = {
      ...formValue,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString()
    };

    const id = this.editingId();
    if (id) {
      this.couponService.updateCoupon(id, dto).subscribe({
        next: () => {
          this.loadCoupons();
          this.closeForm();
        },
        error: (err) => {
          console.error('Ошибка при обновлении', err);
          this.loading.set(false);
        }
      });
    } else {
      this.couponService.createCoupon(dto).subscribe({
        next: () => {
          this.loadCoupons();
          this.closeForm();
        },
        error: (err) => {
          console.error('Ошибка при создании', err);
          this.loading.set(false);
        }
      });
    }
  }

  deleteCoupon(id: number, code: string): void {
    if (confirm(`Вы уверены, что хотите удалить купон "${code}"?`)) {
      this.loading.set(true);
      this.couponService.deleteCoupon(id).subscribe({
        next: () => this.loadCoupons(),
        error: (err) => {
          console.error('Ошибка при удалении', err);
          this.loading.set(false);
        }
      });
    }
  }

  toggleActive(coupon: CouponDto): void {
    const dto: CreateUpdateCouponDto = {
      code: coupon.code,
      description: coupon.description,
      discountValue: coupon.discountValue,
      isPercentage: coupon.isPercentage,
      minOrderAmount: coupon.minOrderAmount,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      maxUsageCount: coupon.maxUsageCount,
      isActive: !coupon.isActive // Инвертируем статус
    };

    this.couponService.updateCoupon(coupon.id, dto).subscribe({
      next: () => this.loadCoupons(),
      error: (err) => console.error('Ошибка при переключении статуса', err)
    });
  }

  // Конвертирует Date в формат "YYYY-MM-DDThh:mm" для <input type="datetime-local">
  private formatDateForInput(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm') || '';
  }
}
