import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<nav *ngIf="authService.isLoggedIn()" class="bg-gray-800 p-4">
  <div class="container mx-auto flex justify-between items-center">
    <a routerLink="/inventory" class="text-white text-lg font-bold">Wardrobe Planner</a>
    <div class="flex items-center">
        <span *ngIf="authService.user()" class="text-white mr-4">
          Bonjour, {{ authService.user()?.name }}
        </span>
        <a routerLink="/inbox" class="text-white mr-4">Inbox</a>
        <a routerLink="/dashboard" class="text-white mr-4">Dashboard</a>
        <a routerLink="/inventory" class="text-white mr-4">Inventaire</a>
        <button (click)="logout()" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
    </div>
  </div>
</nav>
<main class="p-4">
  <router-outlet></router-outlet>
</main>
  `,
})
export class App {
  title = 'garde-robe-budget-app';
  authService = inject(AuthService);
  private router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
