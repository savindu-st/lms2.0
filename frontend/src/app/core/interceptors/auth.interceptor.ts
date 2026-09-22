import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Safely extracts and decodes the anti-CSRF token from document.cookie.
 * Returns null if executed outside browser context or if the cookie is absent.
 */
export function getXsrfCookie(): string | null {
  if (typeof document === 'undefined' || !document.cookie) {
    return null;
  }
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Set withCredentials: true and attach X-XSRF-TOKEN header on mutating requests
  let cloned = req;
  if (req.url.startsWith('http://localhost:5000') || req.url.startsWith('/api')) {
    let headers = req.headers;
    const isMutating = !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method.toUpperCase());
    const xsrfToken = getXsrfCookie();

    if (isMutating && xsrfToken) {
      headers = headers.set('X-XSRF-TOKEN', xsrfToken);
    }

    cloned = req.clone({
      headers,
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
