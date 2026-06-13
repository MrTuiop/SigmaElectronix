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
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
  private toastService = inject(ToastService);

  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  isLogin = signal(true);

  // === Флаги для включения красной подсветки ===
  loginSubmitted = signal(false);
  regSubmitted = signal(false);

  // === Локальные ошибки для конкретных полей ===
  loginErrorMsg = signal('');
  regLoginErrorMsg = signal('');
  regPasswordErrorMsg = signal('');

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

  private usernameSubject = new Subject<string>();

  constructor() {
    // Подписываемся на поток ввода логина
    this.usernameSubject.pipe(
      debounceTime(500), // Ждем 500мс после последнего нажатия клавиши
      distinctUntilChanged(), // Не делаем запрос, если текст не изменился
      switchMap(username => {
        if (!username.trim()) return of(null); // Если пусто - ничего не делаем
        return this.authService.checkUsername(username); // Идем на сервер
      })
    ).subscribe(res => {
      // res придет, когда сервер ответит
      if (res && !res.isAvailable) {
        this.regLoginErrorMsg.set('Этот логин уже занят. Выберите другой.');
      }
    });
  }

  onUsernameInput(value: string): void {
    this.regLoginErrorMsg.set(''); // Сразу убираем ошибку, пока человек печатает
    this.usernameSubject.next(value); // Отправляем новое значение в наш "ждущий" поток
  }

  toggleMode(): void {
    this.isLogin.update(v => !v);
    // Сбрасываем ошибки при переключении
    this.loginSubmitted.set(false);
    this.regSubmitted.set(false);
    this.clearErrors();
  }

  closeModal(): void {
    this.close.emit();
  }

  clearErrors(): void {
    this.loginErrorMsg.set('');
    this.regLoginErrorMsg.set('');
    this.regPasswordErrorMsg.set('');
  }

  onSubmitLogin(): void {
    this.loginSubmitted.set(true);
    this.clearErrors();

    if (!this.login().trim() || !this.password().trim()) {
      return; // Останавливаем отправку, HTML сам подсветит пустые поля
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
        this.loginErrorMsg.set('Неверный логин или пароль');
      }
    });
  }

  onSubmitRegister(): void {
    this.regSubmitted.set(true);
    this.clearErrors();

    const { regLogin, regPhone, regPassword, regConfirmPassword, regEmail } = this;

    if (!regLogin().trim() || !regPhone().trim() || !regPassword().trim() || !regConfirmPassword().trim()) {
      return; // HTML подсветит красным
    }
    if (regPassword() !== regConfirmPassword()) {
      this.regPasswordErrorMsg.set('Пароли не совпадают');
      return;
    }
    if (regPassword().length < 6) {
      this.regPasswordErrorMsg.set('Пароль должен содержать минимум 6 символов');
      return;
    }

    this.authService.register({
      userName: regLogin().trim(),
      phoneNumber: regPhone().trim(),
      password: regPassword(),
      email: regEmail().trim() || null
    }).subscribe({
      next: (res) => {
        // После успешной регистрации сразу авторизуемся
        this.authService.login({ usernameOrEmail: regLogin().trim(), password: regPassword() }).subscribe({
          next: () => {
            this.authenticated.emit();
            this.closeModal();
            this.toastService.success('Успешная регистрация!');
          }
        });
      },
      error: (err: Error) => {
        const msg = err.message.toLowerCase();
        // Перехватываем ошибку уникальности от ASP.NET Identity
        if (msg.includes('taken') || msg.includes('существу') || msg.includes('duplicate') || msg.includes('занят')) {
          this.regLoginErrorMsg.set('Этот логин уже занят. Выберите другой.');
        } else {
          this.toastService.error(err.message);
        }
      }
    });
  }

  togglePassword(field: 'login' | 'reg' | 'confirm'): void {
    if (field === 'login') this.showPassword.update(v => !v);
    else if (field === 'reg') this.showRegPassword.update(v => !v);
    else if (field === 'confirm') this.showRegConfirmPassword.update(v => !v);
  }

  onOverlayMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
