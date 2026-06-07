import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
// все нужные lucide иконки
import { LucideUser, LucidePackage, LucideHeart, LucideMapPin, LucideBell, LucideStar, LucideGift, LucideLogOut } from '@lucide/angular';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterModule,
    LucideUser, LucidePackage, LucideHeart, LucideMapPin, LucideBell, LucideStar, LucideGift, LucideLogOut,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfilePage {
  private authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
