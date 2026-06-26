import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideShieldCheck,
  LucideRefreshCw,
  LucideAlertTriangle,
  LucideChevronDown,
  LucidePenTool
} from '@lucide/angular';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ
import { LanguageService } from '../../services/language-service'; // 👈 ДОБАВИЛИ

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

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
    LucideChevronDown,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './warranty.html',
  styleUrl: './warranty.css'
})
export class WarrantyPage {
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ
  private languageService = inject(LanguageService); // 👈 ИНЖЕКТ

  openFaqId = signal<number | null>(1);

  toggleFaq(id: number) {
    if (this.openFaqId() === id) {
      this.openFaqId.set(null);
    } else {
      this.openFaqId.set(id);
    }
  }

  // 👈 Превратили массив в computed для реактивности при смене языка
  faqs = computed<FaqItem[]>(() => {
    this.languageService.currentLanguage(); // Зависимость для пересчета
    return [
      {
        id: 1,
        question: this.translate.instant('WARRANTY.FAQ.Q1'),
        answer: this.translate.instant('WARRANTY.FAQ.A1')
      },
      {
        id: 2,
        question: this.translate.instant('WARRANTY.FAQ.Q2'),
        answer: this.translate.instant('WARRANTY.FAQ.A2')
      },
      {
        id: 3,
        question: this.translate.instant('WARRANTY.FAQ.Q3'),
        answer: this.translate.instant('WARRANTY.FAQ.A3')
      },
      {
        id: 4,
        question: this.translate.instant('WARRANTY.FAQ.Q4'),
        answer: this.translate.instant('WARRANTY.FAQ.A4')
      }
    ];
  });
}
