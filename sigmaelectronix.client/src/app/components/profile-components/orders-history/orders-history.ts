import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucidePackage } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [
    CommonModule, LucidePackage
  ],
  templateUrl: './orders-history.html',
  styleUrl: './orders-history.css',
})
export class OrdersHistoryComponent {
  data = inject(ProfileService);
}
