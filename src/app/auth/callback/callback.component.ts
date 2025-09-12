// File: src/app/auth/callback/callback.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: '<p>Authentification en cours...</p>',
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        localStorage.setItem('authToken', token);
        this.router.navigate(['/inventory']);
      } else {
        this.router.navigate(['/login-error']); // Optionnel: une route pour gérer les erreurs
      }
    });
  }
}
