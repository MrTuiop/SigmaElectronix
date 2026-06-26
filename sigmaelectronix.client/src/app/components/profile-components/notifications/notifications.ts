import { Component, inject } from '@angular/core';
import { ProfileService } from '../../../services/profile-service';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ ИМПОРТ

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent {
  data = inject(ProfileService);
}
