import { Component, inject } from '@angular/core';
import { LucideStar } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    LucideStar
  ],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css',
})
export class ReviewsComponent {
  data = inject(ProfileService);
}
