import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order-service';
import { OrderDto } from '../../models/order-models';
import { LucideCheckCircle, LucideShieldCheck } from '@lucide/angular';
import { ToastService } from '../../services/toast';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideCheckCircle,
    LucideShieldCheck,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.css'
})
export class PaymentPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ СЕРВИСА

  order = signal<OrderDto | null>(null);
  isLoading = signal(true);
  isPaying = signal(false);

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
          this.toastService.error(this.translate.instant('PAYMENT.TOAST.ORDER_NOT_FOUND')); // 👈
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

    setTimeout(() => {
      this.orderService.payOrder(currentOrder.id).subscribe({
        next: () => {
          this.isPaying.set(false);
          // 👈 Склеиваем: "Оплата заказа" + " №123 " + "прошла успешно!"
          this.toastService.success(`${this.translate.instant('PAYMENT.TOAST.SUCCESS_1')} №${currentOrder.orderNumber} ${this.translate.instant('PAYMENT.TOAST.SUCCESS_2')}`);
          this.router.navigate(['/profile/orders']);
        },
        error: (err) => {
          this.isPaying.set(false);
          // 👈 Склеиваем: "Ошибка оплаты:" + " текст ошибки"
          this.toastService.error(`${this.translate.instant('PAYMENT.TOAST.ERROR')} ${err.message}`);
        }
      });
    }, 1500);
  }
}
