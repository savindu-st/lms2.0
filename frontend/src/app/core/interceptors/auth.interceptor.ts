import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Set withCredentials: true so the browser automatically attaches HttpOnly session and CSRF cookies
  let cloned = req;
  if (req.url.startsWith('http://localhost:5000')) {
    cloned = req.clone({
      withCredentials: true
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/api/auth/login') &&
        !req.url.includes('/api/auth/register') &&
        !req.url.includes('/api/auth/me')
      ) {
        localStorage.removeItem('lms_user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
