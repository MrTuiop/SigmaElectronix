import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nextId = 0;
  private readonly duration = 4000;

  readonly toasts = signal<Toast[]>([]);

  private addToast(message: string, type: Toast['type']): void {
    // Проверка на дубликат: ищем тост с таким же сообщением и типом
    const currentToasts = this.toasts();
    const duplicate = currentToasts.find(
      (t) => t.message === message && t.type === type
    );

    if (duplicate) {
      return;
    }

    const id = this.nextId++;
    const toast: Toast = { id, message, type };

    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.removeToast(id), this.duration);
  }

  removeToast(id: number): void {
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
