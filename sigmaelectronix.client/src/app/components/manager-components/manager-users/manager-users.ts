import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user-service';
import { UserDto, CreateUserDto, UpdateUserDto } from '../../../models/user-models';
import { ToastService } from '../../../services/toast';
import {
  LucideShield, LucideUserPlus, LucideTrash2, LucideEdit2,
  LucideBan, LucideCheckCircle, LucideKey, LucideSearch,
  LucideUser, LucideCheck, LucideChevronDown, LucideArrowLeft,
  LucideX
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';
import { ConfirmModalComponent } from '../../shared-components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-manager-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    LucideShield, LucideUserPlus, LucideTrash2, LucideEdit2,
    LucideBan, LucideCheckCircle, LucideKey, LucideSearch,
    LucideUser, LucideCheck, LucideChevronDown, LucideArrowLeft,
    LucideX,
    SpinnerComponent,
    ConfirmModalComponent // <-- Добавили твою модалку в импорты
  ],
  templateUrl: './manager-users.html',
  styleUrl: './manager-users.css'
})
export class ManagerUsersComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  // --- Состояния ---
  users = signal<UserDto[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  viewMode = signal<'list' | 'form'>('list');
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  userForm!: FormGroup;

  // --- Состояния для модального окна смены пароля ---
  showPasswordModal = signal(false);
  passwordToChange = signal('');
  userForPasswordChange = signal<UserDto | null>(null);

  // --- НОВОЕ: Состояния для окна подтверждения удаления ---
  showConfirmModal = signal(false);
  userToDelete = signal<UserDto | null>(null);

  // --- Умная фильтрация ---
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.users();

    return this.users().filter(u =>
      (u.fullName && u.fullName.toLowerCase().includes(query)) ||
      (u.userName && u.userName.toLowerCase().includes(query)) ||
      u.email.toLowerCase().includes(query) ||
      (u.phoneNumber && u.phoneNumber.includes(query))
    );
  });

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: [''],
      role: ['Customer', Validators.required],
      bonusBalance: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  getUserDisplayName(user: UserDto): string {
    const fName = user.firstName?.trim() || '';
    const lName = user.lastName?.trim() || '';

    if (fName || lName) {
      return `${fName} ${lName}`.trim();
    }

    return user.userName || 'Без имени';
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Ошибка при загрузке пользователей');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // --- Управление формой ---
  openCreateMode(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.userForm.reset({ role: 'Customer', bonusBalance: 0, isActive: true });

    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.viewMode.set('form');
  }

  editUser(user: UserDto): void {
    this.isEditing.set(true);
    this.editingId.set(user.id);

    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    let primaryRole = 'Customer';
    if (user.roles?.includes('Admin')) primaryRole = 'Admin';
    else if (user.roles?.includes('Manager')) primaryRole = 'Manager';

    this.userForm.patchValue({
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      bonusBalance: user.bonusBalance,
      isActive: user.isActive,
      role: primaryRole
    });

    this.viewMode.set('form');
  }

  closeForm(): void {
    this.viewMode.set('list');
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.toastService.error('Пожалуйста, корректно заполните все обязательные поля');
      return;
    }

    this.loading.set(true);
    const formValue = this.userForm.value;

    if (this.isEditing() && this.editingId()) {
      const updateDto: UpdateUserDto = {
        userName: formValue.userName,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        bonusBalance: formValue.bonusBalance,
        isActive: formValue.isActive
      };

      this.userService.updateUser(this.editingId()!, updateDto).subscribe({
        next: () => {
          this.toastService.success('Данные пользователя успешно обновлены!');
          this.loadUsers();
          this.closeForm();
        },
        error: () => {
          this.toastService.error('Ошибка при обновлении данных пользователя');
          this.loading.set(false);
        }
      });
    } else {
      const createDto: CreateUserDto = {
        userName: formValue.userName,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        password: formValue.password,
        role: formValue.role
      };

      this.userService.createUser(createDto).subscribe({
        next: () => {
          this.toastService.success('Новый пользователь успешно создан!');
          this.loadUsers();
          this.closeForm();
        },
        error: () => {
          this.toastService.error('Ошибка при создании пользователя');
          this.loading.set(false);
        }
      });
    }
  }

  // --- Быстрые действия ---
  toggleStatus(user: UserDto): void {
    if (user.roles?.includes('Admin')) {
      this.toastService.error('Нельзя изменить статус администратора!');
      return;
    }

    const action = user.isActive ? 'ЗАБЛОКИРОВАТЬ' : 'РАЗБЛОКИРОВАТЬ';
    if (confirm(`Вы уверены, что хотите ${action} пользователя ${user.fullName || user.userName}?`)) {

      const originalStatus = user.isActive;
      user.isActive = !user.isActive; // Оптимистичный UI

      this.userService.toggleStatus(user.id).subscribe({
        next: () => {
          this.toastService.info(`Статус пользователя изменён на "${user.isActive ? 'Активен' : 'Заблокирован'}"`);
        },
        error: () => {
          user.isActive = originalStatus; // Откат
          this.toastService.error('Не удалось изменить статус пользователя.');
        }
      });
    }
  }

  // 1. Изменили метод: теперь он не использует confirm(), а вызывает модалку
  deleteUser(user: UserDto): void {
    if (user.roles?.includes('Admin')) {
      this.toastService.error('Нельзя удалить аккаунт администратора!');
      return;
    }

    this.userToDelete.set(user);
    this.showConfirmModal.set(true);
  }

  // 2. Метод, который сработает при нажатии "Удалить" внутри модального окна
  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.showConfirmModal.set(false);
    this.loading.set(true);

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.toastService.success('Пользователь успешно удален');
        this.loadUsers();
        this.userToDelete.set(null);
      },
      error: () => {
        this.toastService.error('Не удалось удалить пользователя.');
        this.loading.set(false);
        this.userToDelete.set(null);
      }
    });
  }

  // 3. Метод, который сработает при отмене
  cancelDelete(): void {
    this.showConfirmModal.set(false);
    this.userToDelete.set(null);
  }

  // --- Модальное окно смены пароля ---
  openPasswordModal(user: UserDto): void {
    this.userForPasswordChange.set(user);
    this.passwordToChange.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.userForPasswordChange.set(null);
    this.passwordToChange.set('');
  }

  submitPasswordChange(): void {
    const user = this.userForPasswordChange();
    const newPassword = this.passwordToChange();

    if (!user) return;

    if (newPassword.length < 6) {
      this.toastService.error('Пароль должен содержать минимум 6 символов!');
      return;
    }

    this.loading.set(true);
    this.userService.changePassword(user.id, newPassword).subscribe({
      next: () => {
        this.toastService.success(`Пароль для ${user.email} успешно изменен.`);
        this.loading.set(false);
        this.closePasswordModal();
      },
      error: () => {
        this.toastService.error('Ошибка при смене пароля.');
        this.loading.set(false);
      }
    });
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closePasswordModal();
    }
  }
}
