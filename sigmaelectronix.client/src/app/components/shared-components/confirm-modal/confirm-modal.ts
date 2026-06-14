import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideAlertTriangle, LucideX],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.css']
})
export class ConfirmModalComponent {
  @Input() title: string = 'Подтвердите действие';
  @Input() message: string = 'Вы уверены, что хотите выполнить это действие?';
  @Input() confirmText: string = 'Удалить';
  @Input() cancelText: string = 'Отмена';
  @Input() isDestructive: boolean = true; // Если true — кнопка будет красной

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.close();
  }

  onConfirm() {
    this.confirm.emit();
  }

  close() {
    this.cancel.emit();
  }
}
