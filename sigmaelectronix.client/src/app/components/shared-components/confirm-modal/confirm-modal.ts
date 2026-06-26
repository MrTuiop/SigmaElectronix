import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAlertTriangle, LucideX } from '@lucide/angular';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAlertTriangle,
    LucideX,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './confirm-modal.html',
  styleUrls: ['./confirm-modal.css']
})
export class ConfirmModalComponent {
  // 👇 Дефолты теперь являются ключами перевода
  @Input() title: string = 'CONFIRM.DEFAULT_TITLE';
  @Input() message: string = 'CONFIRM.DEFAULT_MESSAGE';
  @Input() confirmText: string = 'CONFIRM.CONFIRM';
  @Input() cancelText: string = 'CONFIRM.CANCEL';

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
