import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth-service';

import {
  LucideX,
  LucideUser,
  LucideLock,
  LucidePhone,
  LucideMail,
  LucideEye,
  LucideEyeOff
} from '@lucide/angular';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideX,
    LucideUser,
    LucideLock,
    LucidePhone,
    LucideMail,
    LucideEye,
    LucideEyeOff
  ],
  templateUrl: './auth-modal.html',
  styleUrls: ['./auth-modal.css'],
})
export class AuthModalComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService); // <-- внедряем

  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  isLogin = signal(true);

  // Поля входа
  login = signal('');
  password = signal('');
  showPassword = signal(false);

  // Поля регистрации
  regLogin = signal('');
  regPhone = signal('');
  regPassword = signal('');
  regConfirmPassword = signal('');
  regEmail = signal('');
  showRegPassword = signal(false);
  showRegConfirmPassword = signal(false);

  toggleMode(): void {
    this.isLogin.update(v => !v);
  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmitLogin(): void {
    if (!this.login().trim() || !this.password().trim()) {
      this.toastService.error('Заполните все поля');
      return;
    }

    this.authService.login({
      usernameOrEmail: this.login().trim(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.authenticated.emit();
        this.closeModal();
        this.toastService.success('Успешный вход!');
      },
      error: (err: Error) => {
        this.toastService.error(err.message);
      }
    });
  }

  onSubmitRegister(): void {
    const { regLogin, regPhone, regPassword, regConfirmPassword, regEmail } = this;

    if (!regLogin().trim() || !regPhone().trim() || !regPassword().trim() || !regConfirmPassword().trim()) {
      this.toastService.error('Заполните обязательные поля (логин, телефон, пароль)');
      return;
    }
    if (regPassword() !== regConfirmPassword()) {
      this.toastService.error('Пароли не совпадают');
      return;
    }
    if (regPassword().length < 6) {
      this.toastService.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    this.authService.register({
      userName: regLogin().trim(),
      phoneNumber: regPhone().trim(),
      password: regPassword(),
      email: regEmail().trim() || null
    }).subscribe({
      next: (res) => {
        this.toastService.success('Регистрация успешна! Теперь войдите.');
        // Сразу переключаем на форму входа
        this.toggleMode();
      },
      error: (err: Error) => {
        this.toastService.error(err.message);
      }
    });
  }

  togglePassword(field: 'login' | 'reg' | 'confirm'): void {
    if (field === 'login') this.showPassword.update(v => !v);
    else if (field === 'reg') this.showRegPassword.update(v => !v);
    else if (field === 'confirm') this.showRegConfirmPassword.update(v => !v);
  }
}
