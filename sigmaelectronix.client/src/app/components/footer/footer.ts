import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  LucideExternalLink,
  LucideSend,
  LucideVideo,
  LucidePhone,
  LucideMail,
  LucideMapPin,
  LucideClock
} from '@lucide/angular';
import { TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // <-- Обязательно для routerLink
    LucideExternalLink,
    LucideSend,
    LucideVideo,
    LucidePhone,
    LucideMail,
    LucideMapPin,
    LucideClock,
    TranslateDirective
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent { }
