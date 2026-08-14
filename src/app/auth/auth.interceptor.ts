import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  console.log(`[AuthInterceptor] REQUEST: ${req.method} ${req.url}`);

  if (!auth.token) {
    console.log(`[AuthInterceptor] NO TOKEN: ${req.method} ${req.url}`);

    return next(req);
  }

  const authenticatedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  console.log(`[AuthInterceptor] AUTH HEADER ADDED: ${req.method} ${req.url}`);

  return next(authenticatedReq);
};
