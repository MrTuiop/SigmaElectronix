import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

import {
  LucideX,
  LucideCheckCircle,
  LucideAlertCircle,
  LucideInfo
} from '@lucide/angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [
    CommonModule,
    LucideX,
    LucideCheckCircle,
    LucideAlertCircle,
    LucideInfo
  ],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
