import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor, getXsrfCookie } from './auth.interceptor';

describe('authInterceptor & getXsrfCookie', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    // Clean up cookies and localStorage before each test
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    localStorage.clear();
  });

  describe('getXsrfCookie', () => {
    it('should return null when XSRF-TOKEN cookie is not present', () => {
      document.cookie = 'some_other_cookie=value123; path=/';
      expect(getXsrfCookie()).toBeNull();
    });

    it('should extract and decode the XSRF-TOKEN cookie value', () => {
      document.cookie = 'XSRF-TOKEN=abc-123_xyz; path=/';
      expect(getXsrfCookie()).toBe('abc-123_xyz');
    });

    it('should properly URL-decode cookie values', () => {
      document.cookie = 'XSRF-TOKEN=token%2Bwith%2Fspecial%3Dchars; path=/';
      expect(getXsrfCookie()).toBe('token+with/special=chars');
    });
  });

  describe('Cross-Origin Anti-CSRF Header Attachment', () => {
    it('should attach X-XSRF-TOKEN and withCredentials: true on mutating POST requests to backend', () => {
      document.cookie = 'XSRF-TOKEN=csrf-secret-token; path=/';

      http.post('http://localhost:5000/api/auth/logout', {}).subscribe();

      const req = httpMock.expectOne('http://localhost:5000/api/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-secret-token');

      req.flush({ success: true });
    });

    it('should attach X-XSRF-TOKEN on mutating PUT, DELETE, and PATCH requests', () => {
      document.cookie = 'XSRF-TOKEN=csrf-token-update; path=/';

      http.put('http://localhost:5000/api/student/profile', { name: 'Student' }).subscribe();
      const putReq = httpMock.expectOne('http://localhost:5000/api/student/profile');
      expect(putReq.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token-update');
      expect(putReq.request.withCredentials).toBe(true);
      putReq.flush({});

      http.delete('http://localhost:5000/api/courses/1').subscribe();
      const deleteReq = httpMock.expectOne('http://localhost:5000/api/courses/1');
      expect(deleteReq.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token-update');
      expect(deleteReq.request.withCredentials).toBe(true);
      deleteReq.flush({});

      http.patch('http://localhost:5000/api/courses/1', { title: 'Updated' }).subscribe();
      const patchReq = httpMock.expectOne('http://localhost:5000/api/courses/1');
      expect(patchReq.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token-update');
      expect(patchReq.request.withCredentials).toBe(true);
      patchReq.flush({});
    });

    it('should NOT attach X-XSRF-TOKEN on safe GET requests, but should keep withCredentials: true', () => {
      document.cookie = 'XSRF-TOKEN=csrf-secret-token; path=/';

      http.get('http://localhost:5000/api/courses').subscribe();

      const req = httpMock.expectOne('http://localhost:5000/api/courses');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);

      req.flush([]);
    });

    it('should not attach X-XSRF-TOKEN if the cookie is absent, but should proceed with withCredentials: true', () => {
      http.post('http://localhost:5000/api/student/checkout', {}).subscribe();

      const req = httpMock.expectOne('http://localhost:5000/api/student/checkout');
      expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);
      expect(req.request.withCredentials).toBe(true);

      req.flush({});
    });

    it('should NOT modify external non-API requests', () => {
      document.cookie = 'XSRF-TOKEN=csrf-secret-token; path=/';

      http.get('https://external-cdn.com/asset.json').subscribe();

      const req = httpMock.expectOne('https://external-cdn.com/asset.json');
      expect(req.request.withCredentials).toBe(false);
      expect(req.request.headers.has('X-XSRF-TOKEN')).toBe(false);

      req.flush({});
    });
  });

  describe('401 Authentication Redirection', () => {
    it('should remove lms_user and redirect to /login on 401 for protected endpoints', () => {
      localStorage.setItem('lms_user', JSON.stringify({ email: 'student@test.com' }));

      http.get('http://localhost:5000/api/student/my-courses').subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne('http://localhost:5000/api/student/my-courses');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(localStorage.getItem('lms_user')).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should NOT redirect to /login when 401 occurs on /api/auth/login or /api/auth/me', () => {
      localStorage.setItem('lms_user', 'existing');

      http.post('http://localhost:5000/api/auth/login', {}).subscribe({
        error: () => {}
      });
      const loginReq = httpMock.expectOne('http://localhost:5000/api/auth/login');
      loginReq.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      expect(mockRouter.navigate).not.toHaveBeenCalled();

      http.get('http://localhost:5000/api/auth/me').subscribe({
        error: () => {}
      });
      const meReq = httpMock.expectOne('http://localhost:5000/api/auth/me');
      meReq.flush('No active session', { status: 401, statusText: 'Unauthorized' });

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});
