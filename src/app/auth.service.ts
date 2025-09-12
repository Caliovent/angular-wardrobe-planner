import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from './models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly JWT_TOKEN = 'authToken';
  private readonly COOKIE_NAME = 'auth_token';
  isLoggedIn = signal<boolean>(false);
  user = signal<User | null>(null);

  constructor(private apiService: ApiService) {
    this.loadToken();
  }

  private loadToken(): void {
    const token = this.getToken();
    if (token) {
      this.updateStateWithToken(token);
    }
  }

  private updateStateWithToken(token: string): void {
    const user = this.decodeToken(token);
    this.user.set(user);
    this.isLoggedIn.set(true);
    this.saveToken(token);
  }

  handleGoogleAuth(token: string): void {
    this.updateStateWithToken(token);
  }

  private decodeToken(token: string): User | null {
    if (typeof atob === 'undefined') {
      return null;
    }
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const parsedPayload = JSON.parse(decodedPayload);
      return {
        id: parsedPayload.sub,
        name: parsedPayload.name,
        email: parsedPayload.email
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private setCookie(name: string, value: string, days: number): void {
    if (typeof document === 'undefined') return;
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    // Set domain to localhost to ensure the extension can access it.
    // In a real app, this would be your actual domain.
    document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=localhost";
  }

  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = name + '=; Max-Age=-99999999; path=/; domain=localhost';
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.JWT_TOKEN);
  }

  private saveToken(token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.JWT_TOKEN, token);
    this.setCookie(this.COOKIE_NAME, token, 7); // Save cookie for 7 days
  }

  logout(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.JWT_TOKEN);
    this.deleteCookie(this.COOKIE_NAME);
    this.isLoggedIn.set(false);
    this.user.set(null);
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
