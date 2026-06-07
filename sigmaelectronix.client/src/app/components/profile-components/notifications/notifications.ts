import { Component, inject } from '@angular/core';
import { ProfileService } from '../../../services/profile-service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationsComponent {
  data = inject(ProfileService);
}
