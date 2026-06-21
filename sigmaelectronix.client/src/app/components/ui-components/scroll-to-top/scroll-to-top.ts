import { Component, HostListener, signal, ChangeDetectionStrategy } from '@angular/core';
import { LucideArrowUp } from '@lucide/angular';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [LucideArrowUp],
  templateUrl: './scroll-to-top.html',
  styleUrls: ['./scroll-to-top.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScrollToTopComponent {
  isVisible = signal(false);

  // Слушаем событие скролла окна
  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Показываем кнопку, если пользователь проскроллил больше чем на 300px
    const shouldBeVisible = window.scrollY > 300;

    // Обновляем сигнал только если состояние изменилось (защита от лишних ререндеров)
    if (this.isVisible() !== shouldBeVisible) {
      this.isVisible.set(shouldBeVisible);
    }
  }

  scrollToTop() {
    // Плавная прокрутка наверх
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
