import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideTruck,
  LucideMapPin,
  LucideStore,
  LucideClock,
  LucideCreditCard,
  LucideBanknote,
  LucideLandmark,
  LucideShieldCheck,
  LucideCheckCircle2
} from '@lucide/angular';

@Component({
  selector: 'app-delivery-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideTruck, LucideMapPin, LucideStore, LucideClock,
    LucideCreditCard, LucideBanknote, LucideLandmark, LucideShieldCheck, LucideCheckCircle2
  ],
  templateUrl: './delivery.html',
  styleUrl: './delivery.css'
})
export class DeliveryPage {

  deliveryMethods = [
    {
      icon: 'store',
      title: 'Самовывоз из магазина Sigma',
      time: 'Сегодня (при наличии)',
      price: 'Бесплатно',
      description: 'Заберите заказ в любом из наших фирменных магазинов. Товар резервируется на 3 дня.',
      features: ['Можно проверить перед оплатой', 'Помощь с настройкой', 'Оплата при получении']
    },
    {
      icon: 'map-pin',
      title: 'Пункты выдачи (ПВЗ / Постаматы)',
      time: 'От 2 до 5 дней',
      price: 'от 199 ₽',
      description: 'СДЭК, Boxberry, Почта России. Более 10 000 пунктов выдачи по всей стране.',
      features: ['Отслеживание трек-номера', 'Уведомление по SMS', 'Удобный график работы']
    },
    {
      icon: 'truck',
      title: 'Курьерская доставка до двери',
      time: '1 - 3 дня',
      price: 'от 399 ₽',
      description: 'Курьер привезет заказ прямо к вам домой или в офис в удобный временной интервал.',
      features: ['Звонок за час до приезда', 'Доставка тяжелых грузов', 'Бесконтактная передача']
    }
  ];

  paymentMethods = [
    {
      icon: 'credit-card',
      title: 'Картой онлайн',
      description: 'Оплата картами Visa, MasterCard, МИР через защищенный шлюз. Без комиссии.'
    },
    {
      icon: 'banknote',
      title: 'При получении',
      description: 'Наличными или банковской картой курьеру, либо в кассе магазина при самовывозе.'
    },
    {
      icon: 'clock',
      title: 'Рассрочка и Кредит',
      description: 'Оформление онлайн за 5 минут. Рассрочка 0-0-12 или выгодные кредитные программы.'
    },
    {
      icon: 'landmark',
      title: 'Безналичный расчет',
      description: 'Для юридических лиц и ИП. Счет формируется автоматически после оформления заказа.'
    }
  ];
}
