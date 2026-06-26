import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideUser, LucidePackage, LucideHeart, LucideMapPin, LucideBell, LucideStar, LucideGift, LucideLogOut } from '@lucide/angular';
import { AuthService } from '../../services/auth-service';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterModule,
    LucideUser, LucidePackage, LucideHeart, LucideMapPin, LucideBell, LucideStar, LucideGift, LucideLogOut,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
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
