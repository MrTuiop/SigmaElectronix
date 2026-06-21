import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  HostListener,
  computed,
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
  LucideCamera   // <-- ДОБАВИЛИ
} from '@lucide/angular';
import { CategoryService } from '../../../services/category-service';

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

  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();

  // Храним только выбранную корневую категорию
  selectedRootId = signal<number | null>(null);

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

  // Прямые подкатегории выбранной корневой (для вывода сетки справа)
  rootSubCategories = computed(() => {
    return this.selectedRoot()?.subCategories || [];
  });

  // 🎯 ТЕПЕРЬ СЛОВАРЬ РАБОТАЕТ ПО ТОЧНЫМ ID ИЗ БАЗЫ ДАННЫХ
  private iconMap: Record<string, any> = {
    'smartphone': LucideSmartphone,
    'laptop': LucideLaptop,
    'headphones': LucideHeadphones,
    'watch': LucideWatch,
    'tv': LucideTv,
    'gamepad-2': LucideGamepad2,
    'monitor': LucideMonitor,
    'camera': LucideCamera,
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
