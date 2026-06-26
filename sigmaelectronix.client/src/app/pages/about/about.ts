import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideShieldCheck,
  LucideAward,
  LucideZap,
  LucideUsers,
  LucideThumbsUp,
  LucideGlobe
} from '@lucide/angular';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core'; // 👈 ДОБАВИЛИ

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    LucideShieldCheck,
    LucideAward,
    LucideZap,
    LucideUsers,
    LucideThumbsUp,
    LucideGlobe,
    TranslateDirective, // 👈 ДОБАВИЛИ
    TranslatePipe       // 👈 ДОБАВИЛИ
  ],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutPage {
}
