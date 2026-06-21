import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideUser, LucidePencil, LucideCheck, LucideX, LucideCamera } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';

import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastService } from '../../../services/toast';
import { FileService } from '../../../services/file-service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    LucideUser, LucidePencil, LucideCheck, LucideX, LucideCamera
  ],
  templateUrl: './profile-details.html',
  styleUrl: './profile-details.css',
})
export class ProfileDetailsComponent {
  data = inject(ProfileService);
  toastService = inject(ToastService); // <-- сервис уведомлений
  fileService = inject(FileService);

  editingField: string | null = null;
  editValue = '';
  saving = false;

  isUploadingAvatar = signal(false);
  avatarUploadProgress = signal(0);

  onAvatarSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const userId = this.data.user()?.id;

    if (!userId) {
      alert('Ошибка: пользователь не найден');
      return;
    }

    this.isUploadingAvatar.set(true);
    this.avatarUploadProgress.set(0);

    // Загружаем картинку в папку 'avatars'
    this.fileService.uploadImageWithProgress(file, 'avatars', userId).subscribe({
      next: (e: any) => {
        // Отслеживаем проценты
        if (e.type === HttpEventType.UploadProgress && e.total) {
          const percentDone = Math.round(100 * e.loaded / e.total);
          this.avatarUploadProgress.set(percentDone);
        }
        // Загрузка завершена, получили ссылку
        else if (e.type === HttpEventType.Response) {
          const res = e.body;
          if (res?.url) {

            // 💡 РЕШЕНИЕ ПРОБЛЕМЫ С КЭШЕМ:
            // Генерируем уникальную метку времени
            const timestamp = new Date().getTime();
            // Если в URL уже есть параметры (?), добавляем через &, иначе через ?
            const noCacheUrl = res.url.includes('?')
              ? `${res.url}&t=${timestamp}`
              : `${res.url}?t=${timestamp}`;

            // Отправляем новый URL на сервер для сохранения профиля
            this.data.updateAvatar(noCacheUrl).subscribe({
              next: () => {
                this.toastService.success('Аватар успешно обновлён');
                this.isUploadingAvatar.set(false);
              },
              error: () => {
                this.toastService.error('Не удалось сохранить аватар в профиль');
                this.isUploadingAvatar.set(false);
              }
            });
          }
        }
      },
      error: () => {
        this.toastService.error('Ошибка при загрузке картинки');
        this.isUploadingAvatar.set(false);
      }
    });
  }

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
