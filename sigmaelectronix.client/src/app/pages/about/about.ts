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
    LucideGlobe
  ],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class AboutPage {
}
