import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  HostListener,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideSmartphone,
  LucideLaptop,
  LucideHeadphones,
  LucideWatch,
  LucideTv,
  LucideGamepad2,
  LucideFolder,
  LucideChevronRight,
  LucideMonitor, // <-- ДОБАВИЛИ
  LucideCamera,   // <-- ДОБАВИЛИ
  LucideHome,
  LucideCoffee,
  LucideSnowflake,
  LucideLightbulb,
  LucideBot,
  LucideTablet,
  LucideCpu,
  LucideCircuitBoard,
  LucideServer,
  LucideHardDrive,
  LucideNetwork,
  LucideRouter,
  LucideWifi,
  LucideCable
} from '@lucide/angular';
import { CategoryService } from '../../../services/category-service';
import { LanguageService } from '../../../services/language-service';

@Component({
  selector: 'app-category-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideSmartphone,
    LucideLaptop,
    LucideHeadphones,
    LucideWatch,
    LucideTv,
    LucideGamepad2,
    LucideFolder,
    LucideChevronRight,
    LucideMonitor, // <-- ДОБАВИЛИ СЮДА
    LucideCamera   // <-- ДОБАВИЛИ СЮДА
  ],
  templateUrl: './category-menu.html',
  styleUrls: ['./category-menu.css'],
  host: {
    'class': 'mega-menu-host',
    '[class.open]': 'isOpen'
  }
})
export class CategoryMenuComponent {
  private categoryService = inject(CategoryService);
  private languageService = inject(LanguageService);

  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();

  // Храним только выбранную корневую категорию
  selectedRootId = signal<number | null>(null);

  private previousLanguage = signal<string>(this.languageService.currentLanguage());

  // Дерево категорий
  tree = computed(() => this.categoryService.categoryTree());

  // Умно вычисляем выбранную категорию: 
  // Если пользователь навел мышку - берем её. Если нет - по умолчанию берем первую!
  selectedRoot = computed(() => {
    const categories = this.tree();
    if (categories.length === 0) return null;

    const id = this.selectedRootId();
    if (id) {
      return categories.find(c => c.id === id) || categories[0];
    }
    return categories[0]; // Авто-выбор первой категории при открытии меню
  });

  private readonly menuLanguageEffect = effect(() => {
    const currentLang = this.languageService.currentLanguage();
    if (this.previousLanguage() !== currentLang) {
      this.previousLanguage.set(currentLang);
      this.categoryService.loadTree().subscribe();
    }
  });

  // Прямые подкатегории выбранной корневой (для вывода сетки справа)
  rootSubCategories = computed(() => {
    return this.selectedRoot()?.subCategories || [];
  });

  // 🎯 ТЕПЕРЬ СЛОВАРЬ РАБОТАЕТ ПО ТОЧНЫМ ID ИЗ БАЗЫ ДАННЫХ
  private iconMap: Record<string, any> = {
    // --- Базовые и старые ---
    'smartphone': LucideSmartphone,
    'laptop': LucideLaptop,
    'headphones': LucideHeadphones,
    'watch': LucideWatch,
    'tv': LucideTv,
    'gamepad-2': LucideGamepad2,
    'monitor': LucideMonitor,
    'camera': LucideCamera,

    // --- 🏠 Бытовая техника ---
    'home': LucideHome,
    'coffee': LucideCoffee,
    'snowflake': LucideSnowflake,
    'lightbulb': LucideLightbulb,
    'bot': LucideBot,

    // --- 📱 Планшеты (в дополнение к смартфонам) ---
    'tablet': LucideTablet,

    // --- ⚙️ Комплектующие ПК ---
    'cpu': LucideCpu,
    'circuit-board': LucideCircuitBoard,
    'server': LucideServer,
    'hard-drive': LucideHardDrive,

    // --- 🛜 Сетевое оборудование ---
    'router': LucideRouter,
    'network': LucideNetwork,
    'wifi': LucideWifi,
    'cable': LucideCable,

    // --- Дефолтная заглушка в самом конце ---
    'folder': LucideFolder
  };

  getIcon(iconKey?: string | null) {
    if (!iconKey) {
      return LucideFolder;
    }

    // Ищем компонент в словаре. Если ключа нет - отдаем папку по умолчанию
    return this.iconMap[iconKey] || LucideFolder;
  }

  ngOnChanges() {
    if (this.isOpen && this.tree().length === 0) {
      this.categoryService.loadTree().subscribe();
    }
  }

  // Теперь выбор происходит по наведению мыши
  onRootHover(id: number) {
    this.selectedRootId.set(id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    const host = (event.target as HTMLElement)?.closest('app-category-menu');
    const catalogBtn = document.querySelector('.catalog-btn');

    if (!host && !catalogBtn?.contains(target)) {
      this.closeMenu.emit();
      this.selectedRootId.set(null);
    }
  }

  onLinkClick() {
    this.closeMenu.emit();
  }
}
