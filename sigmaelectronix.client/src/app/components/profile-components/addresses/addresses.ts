import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus, LucideMapPin, LucideX } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';
import { CityService } from '../../../services/city-service'; // 👈 ДОБАВИЛИ ИМПОРТ
import { CityDto } from '../../../models/location-models';   // 👈 ДОБАВИЛИ ИМПОРТ
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucidePlus, LucideMapPin, LucideX, TranslateDirective, TranslatePipe],
  templateUrl: './addresses.html',
  styleUrl: './addresses.css',
})
export class AddressesComponent implements OnInit {
  data = inject(ProfileService);
  private fb = inject(FormBuilder);
  private cityService = inject(CityService); // 👈 ВЕРНУЛИ сервис городов

  // Состояния
  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  errorMessage = signal<string | null>(null);

  cities = signal<CityDto[]>([]); // 👈 ВЕРНУЛИ сигнал для списка городов

  addressForm!: FormGroup;

  ngOnInit() {
    // 👈 Загружаем города при инициализации компонента
    this.cityService.getAll().subscribe({
      next: (res) => this.cities.set(res),
      error: (err) => console.error('Ошибка загрузки городов', err)
    });

    this.addressForm = this.fb.group({
      title: ['', Validators.required],
      cityId: [null, Validators.required], // 👈 ИЗМЕНИЛИ: теперь cityId вместо cityName
      street: ['', Validators.required],
      building: ['', Validators.required],
      apartment: [''],
      postalCode: ['', Validators.required],
      isDefault: [false]
    });
  }

  addAddress() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.errorMessage.set(null);
    this.addressForm.reset({ isDefault: false, cityId: null });
    this.showModal.set(true);
  }

  editAddress(id: number) {
    const address = this.data.addresses().find(a => a.id === id);
    if (address) {
      this.isEditing.set(true);
      this.editingId.set(id);
      this.errorMessage.set(null);

      this.addressForm.patchValue({
        title: address.title,
        cityId: address.cityId, // 👈 Подставляем ID города из DTO
        street: address.originalStreet,
        building: address.originalBuilding,
        apartment: address.originalApartment,
        postalCode: address.zip,
        isDefault: address.isDefault
      });

      this.showModal.set(true);
    }
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveAddress() {
    if (this.addressForm.invalid) return;

    const dto = this.addressForm.value;
    // На всякий случай конвертируем в число, так как HTML select иногда отдает строки
    dto.cityId = Number(dto.cityId);

    this.errorMessage.set(null);

    const request$ = this.isEditing() && this.editingId()
      ? this.data.updateAddress(this.editingId()!, dto)
      : this.data.createAddress(dto);

    request$.subscribe({
      next: () => this.closeModal(),
      error: (err) => {
        // Если бэкенд отдает текст ошибки, можно его показать
        const msg = err.error?.message || 'Произошла ошибка при сохранении адреса.';
        this.errorMessage.set(msg);
      }
    });
  }

  deleteAddress(id: number) {
    if (confirm('Вы уверены, что хотите удалить этот адрес?')) {
      this.data.deleteAddress(id).subscribe();
    }
  }
}
