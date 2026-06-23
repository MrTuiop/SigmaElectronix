import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideShieldCheck,
  LucideRefreshCw,
  LucideAlertTriangle,
  LucideChevronDown,
  LucidePenTool
} from '@lucide/angular';

@Component({
  selector: 'app-warranty',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideShieldCheck,
    LucidePenTool,
    LucideRefreshCw,
    LucideAlertTriangle,
    LucideChevronDown
  ],
  templateUrl: './warranty.html',
  styleUrl: './warranty.css'
})
export class WarrantyPage {
  // Состояние для аккордеона. По умолчанию открыт первый вопрос.
  openFaqId = signal<number | null>(1);

  toggleFaq(id: number) {
    if (this.openFaqId() === id) {
      this.openFaqId.set(null);
    } else {
      this.openFaqId.set(id);
    }
  }

  faqs = [
    {
      id: 1,
      question: 'Какой срок гарантии на товары?',
      answer: 'На все новые товары в нашем магазине предоставляется официальная гарантия от производителя сроком на 1 год. На уцененные товары и витринные образцы действует гарантия от магазина сроком 3 месяца.'
    },
    {
      id: 2,
      question: 'Как вернуть товар надлежащего качества?',
      answer: 'Вы можете вернуть товар в течение 14 дней с момента покупки, если он не был в употреблении, сохранены его товарный вид, потребительские свойства, пломбы, фабричные ярлыки, а также кассовый чек.'
    },
    {
      id: 3,
      question: 'Что делать при обнаружении брака?',
      answer: 'При обнаружении недостатка вы вправе обратиться в сервисный центр производителя либо к нам в магазин. Мы проведем диагностику и, если брак подтвердится, предложим ремонт, замену или возврат средств.'
    },
    {
      id: 4,
      question: 'Что не является гарантийным случаем?',
      answer: 'Гарантия не распространяется на механические повреждения, повреждения, вызванные попаданием влаги (если устройство не имеет соответствующей защиты), а также на неисправности, возникшие из-за нарушения правил эксплуатации.'
    }
  ];
}
