import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  isBumping?: boolean; // <-- Флаг для анимации дубликата
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nextId = 0;
  private readonly duration = 4000;

  readonly toasts = signal<Toast[]>([]);

  // <-- Храним таймеры, чтобы сбрасывать их при дублировании
  private timeouts = new Map<number, any>();

  private addToast(message: string, type: Toast['type']): void {
    const currentToasts = this.toasts();
    const duplicate = currentToasts.find(
      (t) => t.message === message && t.type === type
    );

    if (duplicate) {
      // 1. Сбрасываем старый таймер, чтобы уведомление не исчезло раньше времени
      if (this.timeouts.has(duplicate.id)) {
        clearTimeout(this.timeouts.get(duplicate.id));
      }

      // 2. Ставим новый таймер (еще на 4 секунды)
      this.timeouts.set(
        duplicate.id,
        setTimeout(() => this.removeToast(duplicate.id), this.duration)
      );

      // 3. Включаем анимацию "пульсации"
      this.toasts.update(list => list.map(t =>
        t.id === duplicate.id ? { ...t, isBumping: true } : t
      ));

      // 4. Выключаем класс через 300мс, чтобы при следующем клике анимация сработала снова
      setTimeout(() => {
        this.toasts.update(list => list.map(t =>
          t.id === duplicate.id ? { ...t, isBumping: false } : t
        ));
      }, 300);

      return;
    }

    const id = this.nextId++;
    const toast: Toast = { id, message, type };

    this.toasts.update((list) => [...list, toast]);

    // Сохраняем таймер нового тоста
    this.timeouts.set(
      id,
      setTimeout(() => this.removeToast(id), this.duration)
    );
  }

  removeToast(id: number): void {
    if (this.timeouts.has(id)) {
      clearTimeout(this.timeouts.get(id));
      this.timeouts.delete(id);
    }
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  success(message: string): void {
    this.addToast(message, 'success');
  }

  error(message: string): void {
    this.addToast(message, 'error');
  }

  info(message: string): void {
    this.addToast(message, 'info');
  }
}
