import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order-service';
import { OrderDto } from '../../models/order-model';
import { LucideCheckCircle, LucideShieldCheck } from '@lucide/angular';
import { ToastService } from '../../services/toast'; // <-- Убедись, что путь до сервиса правильный

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [CommonModule, LucideCheckCircle, LucideShieldCheck],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.css'
})
export class PaymentPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  // 1. Внедряем твой сервис уведомлений
  private toastService = inject(ToastService);

  order = signal<OrderDto | null>(null);
  isLoading = signal(true);
  isPaying = signal(false);

  // Генерируем QR-код с твоим рикроллом через API QRServer (ссылка закодирована для надежности)
  qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Frutube.ru%2Fvideo%2Fbe9b5aece2911aecc68fa03942e25bac%2F%3Fr%3Dplwd';

  ngOnInit() {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));

    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe({
        next: (o) => {
          this.order.set(o);
          this.isLoading.set(false);
        },
        error: () => {
          // 2. Выводим красное уведомление вместо alert
          this.toastService.error('Заказ не найден');
          this.router.navigate(['/']);
        }
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  simulatePayment() {
    const currentOrder = this.order();
    if (!currentOrder) return;

    this.isPaying.set(true);

    // Имитируем небольшую задержку (1.5 сек) для красоты
    setTimeout(() => {
      this.orderService.payOrder(currentOrder.id).subscribe({
        next: () => {
          this.isPaying.set(false);
          // 3. Выводим зеленое уведомление об успехе
          this.toastService.success(`Оплата заказа №${currentOrder.orderNumber} прошла успешно!`);
          this.router.navigate(['/profile/orders']); // Логичнее перекинуть сразу в историю заказов
        },
        error: (err) => {
          this.isPaying.set(false);
          // 4. Выводим красное уведомление с ошибкой
          this.toastService.error('Ошибка оплаты: ' + err.message);
        }
      });
    }, 1500);
  }
}
