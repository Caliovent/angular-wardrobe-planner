import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-gray-800 p-4">
      <div class="container mx-auto flex justify-between items-center">
        <a routerLink="/" class="text-white text-lg font-bold">Garde-Robe Budget App</a>
        <div>
          <ng-container *ngIf="authService.isLoggedIn(); else loggedOut">
            <a routerLink="/inbox" class="text-white mr-4">Inbox</a>
            <a routerLink="/dashboard" class="text-white mr-4">Dashboard</a>
            <button (click)="logout()" class="text-white">Logout</button>
          </ng-container>
          <ng-template #loggedOut>
            <a routerLink="/login" class="text-white mr-4">Login</a>
            <a routerLink="/register" class="text-white">Register</a>
          </ng-template>
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
    this.router.navigate(['/login']);
  }
}
