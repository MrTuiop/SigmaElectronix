import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  LucideExternalLink,
  LucideSend,
  LucideVideo,
  LucidePhone,
  LucideMail,
  LucideMapPin,
  LucideClock
} from '@lucide/angular';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    LucideExternalLink,
    LucideSend,
    LucideVideo,
    LucidePhone,
    LucideMail,
    LucideMapPin,
    LucideClock
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {}
