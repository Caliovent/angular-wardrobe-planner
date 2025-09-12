// src/app/home/home.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Welcome</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">Wardrobe Planner</h1>
          <p class="text-gray-600 mb-6">Planifiez votre style, maîtrisez votre budget.</p>
          <ion-button *ngIf="!authService.isLoggedIn()" (click)="loginWithGoogle()" size="large">
            <ion-icon slot="start" name="logo-google"></ion-icon>
            Se connecter avec Google
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
})
export class HomeComponent {
  authService = inject(AuthService);
  private backendUrl = environment.production
    ? 'https://angular-wardrobe-planner.onrender.com' // URL de production
    : 'http://localhost:3000'; // URL de développement

  loginWithGoogle(): void {
    window.location.href = `${this.backendUrl}/api/auth/google`;
  }
}
