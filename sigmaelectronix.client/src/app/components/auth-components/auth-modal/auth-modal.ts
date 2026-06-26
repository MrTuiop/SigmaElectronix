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
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';

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
    LucideEyeOff,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './auth-modal.html',
  styleUrls: ['./auth-modal.css'],
})
export class AuthModalComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  @Output() close = new EventEmitter<void>();
  @Output() authenticated = new EventEmitter<void>();

  isLogin = signal(true);

  loginSubmitted = signal(false);
  regSubmitted = signal(false);

  loginErrorMsg = signal('');
  regLoginErrorMsg = signal('');
  regPasswordErrorMsg = signal('');

  login = signal('');
  password = signal('');
  showPassword = signal(false);

  regLogin = signal('');
  regPhone = signal('');
  regPassword = signal('');
  regConfirmPassword = signal('');
  regEmail = signal('');
  showRegPassword = signal(false);
  showRegConfirmPassword = signal(false);

  private usernameSubject = new Subject<string>();

  constructor() {
    this.usernameSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(username => {
        if (!username.trim()) return of(null);
        return this.authService.checkUsername(username);
      })
    ).subscribe(res => {
      if (res && !res.isAvailable) {
        this.regLoginErrorMsg.set(this.translate.instant('AUTH.ALREADYUSE')); // 👈
      }
    });
  }

  onUsernameInput(value: string): void {
    this.regLoginErrorMsg.set('');
    this.usernameSubject.next(value);
  }

  toggleMode(): void {
    this.isLogin.update(v => !v);
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
      return;
    }

    this.authService.login({
      usernameOrEmail: this.login().trim(),
      password: this.password()
    }).subscribe({
      next: () => {
        this.authenticated.emit();
        this.closeModal();
        this.toastService.success(this.translate.instant('AUTH.TOAST.LOGIN_SUCCESS')); // 👈
      },
      error: (err: Error) => {
        this.loginErrorMsg.set(this.translate.instant('AUTH.ERROR.INVALID_CREDENTIALS')); // 👈
      }
    });
  }

  onSubmitRegister(): void {
    this.regSubmitted.set(true);
    this.clearErrors();

    const { regLogin, regPhone, regPassword, regConfirmPassword, regEmail } = this;

    if (!regLogin().trim() || !regPhone().trim() || !regPassword().trim() || !regConfirmPassword().trim()) {
      return;
    }
    if (regPassword() !== regConfirmPassword()) {
      this.regPasswordErrorMsg.set(this.translate.instant('AUTH.ERROR.PASSWORDS_MISMATCH')); // 👈
      return;
    }
    if (regPassword().length < 6) {
      this.regPasswordErrorMsg.set(this.translate.instant('AUTH.ERROR.PASSWORD_MIN_LENGTH')); // 👈
      return;
    }

    this.authService.register({
      userName: regLogin().trim(),
      phoneNumber: regPhone().trim(),
      password: regPassword(),
      email: regEmail().trim() || null
    }).subscribe({
      next: (res) => {
        this.authService.login({ usernameOrEmail: regLogin().trim(), password: regPassword() }).subscribe({
          next: () => {
            this.authenticated.emit();
            this.closeModal();
            this.toastService.success(this.translate.instant('AUTH.TOAST.REGISTER_SUCCESS')); // 👈
          }
        });
      },
      error: (err: Error) => {
        const msg = err.message.toLowerCase();
        if (msg.includes('taken') || msg.includes('существу') || msg.includes('duplicate') || msg.includes('занят')) {
          this.regLoginErrorMsg.set(this.translate.instant('AUTH.ERROR.LOGIN_TAKEN')); // 👈
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
