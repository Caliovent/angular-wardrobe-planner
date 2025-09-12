import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly JWT_TOKEN = 'jwt_token';
  isLoggedIn = signal<boolean>(this.hasToken());

  constructor(private apiService: ApiService) { }

  private hasToken(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem(this.JWT_TOKEN);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.JWT_TOKEN);
  }

  private saveToken(token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.JWT_TOKEN, token);
    this.isLoggedIn.set(true);
  }

  logout(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.JWT_TOKEN);
    this.isLoggedIn.set(false);
  }

  register(userInfo: any): Observable<any> {
    return this.apiService.register(userInfo);
  }

  login(credentials: any): Observable<{ token: string }> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        if (response && response.token) {
          this.saveToken(response.token);
        }
      })
    );
  }
}
