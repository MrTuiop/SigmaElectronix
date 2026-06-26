import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideGlobe, LucideCheck, LucideChevronDown } from '@lucide/angular';
import { LanguageService } from '../../../services/language-service';
import { LanguageDto } from '../../../models/language-models';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, LucideGlobe, LucideCheck, LucideChevronDown, TranslateDirective],
  templateUrl: './language-selector.html',
  styleUrl: './language-selector.css'
})
export class LanguageSelectorComponent implements OnInit {
  private languageService = inject(LanguageService);

  // Состояния
  languages = signal<LanguageDto[]>([]);
  isOpen = signal(false);

  // Текущий язык (привязан к сервису)
  currentLangCode = this.languageService.currentLanguage;

  // Красивое отображение текущего языка (например, "RU" или "EN")
  currentLanguageDisplay = computed(() => {
    const code = this.currentLangCode();
    const lang = this.languages().find(l => l.code === code);
    // Если язык найден - выводим его код в верхнем регистре, если нет - берем из кэша
    return lang ? lang.code.toUpperCase() : code.toUpperCase();
  });

  ngOnInit(): void {
    // Загружаем только активные языки
    this.languageService.getAllLanguages(false).subscribe({
      next: (data) => this.languages.set(data),
      error: (err) => console.error('Ошибка при загрузке языков', err)
    });
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  selectLanguage(code: string): void {
    this.languageService.changeLanguage(code);
    this.isOpen.set(false);
  }

  // Закрытие меню при клике вне его области
  @HostListener('document:click')
  closeMenu(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
