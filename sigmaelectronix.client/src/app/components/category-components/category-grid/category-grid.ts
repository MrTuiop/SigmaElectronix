import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideLayoutGrid } from '@lucide/angular';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideLayoutGrid // Оставили только одну универсальную иконку
  ],
  templateUrl: './category-grid.html',
  styleUrl: './category-grid.css',
})
export class CategoryGridComponent {
  // Поле icon теперь необязательно, раз мы его не используем напрямую
  @Input() categories!: { name: string; slug: string; icon?: string; imageUrl?: string }[];
}
