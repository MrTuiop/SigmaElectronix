import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [RouterOutlet, ToastComponent], // Оставили только Outlet и Toast
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sigmaelectronix.client');
}
