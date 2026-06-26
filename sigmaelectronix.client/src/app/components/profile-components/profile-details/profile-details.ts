import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideUser, LucidePencil, LucideCheck, LucideX, LucideCamera } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastService } from '../../../services/toast';
import { FileService } from '../../../services/file-service';
import { HttpEventType } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ ИМПОРТ
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДЛЯ ШАБЛОНА

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    LucideUser, LucidePencil, LucideCheck, LucideX, LucideCamera,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './profile-details.html',
  styleUrl: './profile-details.css',
})
export class ProfileDetailsComponent {
  data = inject(ProfileService);
  toastService = inject(ToastService);
  fileService = inject(FileService);
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ СЕРВИСА

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
      alert(this.translate.instant('PROFILE.DETAILS.ALERT_USER_NOT_FOUND')); // 👈
      return;
    }

    this.isUploadingAvatar.set(true);
    this.avatarUploadProgress.set(0);

    this.fileService.uploadImageWithProgress(file, 'avatars', userId).subscribe({
      next: (e: any) => {
        if (e.type === HttpEventType.UploadProgress && e.total) {
          const percentDone = Math.round(100 * e.loaded / e.total);
          this.avatarUploadProgress.set(percentDone);
        }
        else if (e.type === HttpEventType.Response) {
          const res = e.body;
          if (res?.url) {
            const timestamp = new Date().getTime();
            const noCacheUrl = res.url.includes('?')
              ? `${res.url}&t=${timestamp}`
              : `${res.url}?t=${timestamp}`;

            this.data.updateAvatar(noCacheUrl).subscribe({
              next: () => {
                this.toastService.success(this.translate.instant('PROFILE.DETAILS.TOAST.AVATAR_UPDATED')); // 👈
                this.isUploadingAvatar.set(false);
              },
              error: () => {
                this.toastService.error(this.translate.instant('PROFILE.DETAILS.TOAST.AVATAR_SAVE_ERROR')); // 👈
                this.isUploadingAvatar.set(false);
              }
            });
          }
        }
      },
      error: () => {
        this.toastService.error(this.translate.instant('PROFILE.DETAILS.TOAST.AVATAR_UPLOAD_ERROR')); // 👈
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
      case 'userName':
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

        // 👈 ПЕРЕВОДИМ СООБЩЕНИЯ ОБ УСПЕХЕ
        const messages: Record<string, string> = {
          firstName: this.translate.instant('PROFILE.DETAILS.TOAST.FIRST_NAME_UPDATED'),
          lastName: this.translate.instant('PROFILE.DETAILS.TOAST.LAST_NAME_UPDATED'),
          email: this.translate.instant('PROFILE.DETAILS.TOAST.EMAIL_UPDATED'),
          phone: this.translate.instant('PROFILE.DETAILS.TOAST.PHONE_UPDATED'),
          userName: this.translate.instant('PROFILE.DETAILS.TOAST.USERNAME_UPDATED'),
        };
        this.toastService.success(messages[field] || this.translate.instant('PROFILE.DETAILS.TOAST.DATA_SAVED'));
      },
      error: (err) => {
        console.error('Ошибка сохранения', err);
        this.saving = false;
        this.toastService.error(this.translate.instant('PROFILE.DETAILS.TOAST.SAVE_ERROR')); // 👈
      }
    });
  }
}
