import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideUser, LucidePencil, LucideCheck, LucideX } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';

import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    LucideUser, LucidePencil, LucideCheck, LucideX
  ],
  templateUrl: './profile-details.html',
  styleUrl: './profile-details.css',
})
export class ProfileDetailsComponent {
  data = inject(ProfileService);
  toastService = inject(ToastService); // <-- сервис уведомлений

  editingField: string | null = null;
  editValue = '';
  saving = false;

  startEdit(field: string, currentValue: string) {
    this.editingField = field;
    this.editValue = currentValue;
  }

  cancelEdit() {
    this.editingField = null;
  }

  saveEdit(field: string) {
    if (this.saving) return;
    const user = this.data.user();
    if (!user) return;

    this.saving = true;
    let request$: Observable<any>;

    switch (field) {
      case 'firstName':
        request$ = this.data.updateFirstName(this.editValue);
        break;
      case 'lastName':
        request$ = this.data.updateLastName(this.editValue);
        break;
      case 'email':
        request$ = this.data.updateEmail(this.editValue);
        break;
      case 'phone':
        request$ = this.data.updatePhone(this.editValue);
        break;
      case 'userName':                    // <-- новый case
        request$ = this.data.updateUserName(this.editValue);
        break;
      default:
        this.saving = false;
        return;
    }

    request$.subscribe({
      next: () => {
        this.editingField = null;
        this.saving = false;
        const messages: Record<string, string> = {
          firstName: 'Имя успешно обновлено',
          lastName: 'Фамилия успешно обновлена',
          email: 'Email успешно обновлён',
          phone: 'Телефон успешно обновлён',
          userName: 'Логин успешно обновлён',   // <-- сообщение
        };
        this.toastService.success(messages[field] || 'Данные сохранены');
      },
      error: (err) => {
        console.error('Ошибка сохранения', err);
        this.saving = false;
        this.toastService.error('Не удалось сохранить изменения. Попробуйте позже.');
      }
    });
  }
}
