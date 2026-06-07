import { Component, inject, OnInit } from '@angular/core';
import { LucideGift } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-bonuses',
  standalone: true,
  imports: [
    DatePipe,
    LucideGift
  ],
  templateUrl: './bonuses.html',
  styleUrl: './bonuses.css',
})
export class BonusesComponent implements OnInit {
  data = inject(ProfileService);

  ngOnInit(): void {
    this.data.loadBonusHistory().subscribe();
  }
}
