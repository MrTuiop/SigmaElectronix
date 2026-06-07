import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-category-grid',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './category-grid.html',
  styleUrl: './category-grid.css',
})
export class CategoryGridComponent {
  @Input() categories!: { name: string; slug: string; icon: string }[];
}

