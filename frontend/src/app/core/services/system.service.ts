import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Branding } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/system';

  private brandingSignal = signal<Branding | null>(null);

  branding = this.brandingSignal.asReadonly();
  academyName = computed(() => this.brandingSignal()?.academyName || 'Accounting Academy LMS');
  instructorName = computed(() => this.brandingSignal()?.instructorName || 'Academy Instructor');
  instructorTitle = computed(() => this.brandingSignal()?.instructorTitle || 'Lead Instructor & CPA');
  bankDetails = computed(() => this.brandingSignal()?.bankDetails || null);

  constructor() {
    this.fetchBranding().subscribe({
      error: (err) => console.warn('Could not load system branding:', err)
    });
  }

  fetchBranding(): Observable<Branding> {
    return this.http.get<Branding>(`${this.apiUrl}/branding`).pipe(
      tap(res => this.brandingSignal.set(res))
    );
  }
}
