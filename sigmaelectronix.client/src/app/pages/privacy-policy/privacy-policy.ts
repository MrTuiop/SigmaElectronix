import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateService, TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css'
})
export class PrivacyPolicyComponent {
  private translate = inject(TranslateService); // 👈 ИНЖЕКТ (на будущее)
  lastUpdate = '15 октября 2026 г.'; // 👈 Оставляем как есть, либо форматируй через DatePipe
}
