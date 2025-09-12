import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Only attach token for requests to our API, and not for auth routes
  const isApiUrl = req.url.startsWith('http://localhost:3000/api');
  if (token && isApiUrl && !req.url.endsWith('/login') && !req.url.endsWith('/register')) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
