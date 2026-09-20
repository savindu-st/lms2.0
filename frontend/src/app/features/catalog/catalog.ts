import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Course, CourseDetail } from '../../core/models/models';
import { CourseService } from '../../core/services/course.service';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutModalComponent } from '../../shared/components/checkout-modal/checkout-modal';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CheckoutModalComponent],
  template: `
    <div class="catalog-page">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container hero-content">
          <div class="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Official Online Academy &bull; Prof. Marcus Vance, CPA
          </div>
          <h1 class="hero-title">
            Master Corporate <span class="gradient-text">Accounting & Finance</span>
          </h1>
          <p class="hero-subtitle">
            Structured monthly intensive masterclasses covering financial statement reconciliation, accruals & GAAP, managerial cost budgeting, and audit defense. Built for career acceleration and CPA exam readiness.
          </p>

          <div class="hero-features">
            <div class="feat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>New Masterclasses Added Every Month</span>
            </div>
            <div class="feat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Time-Limited Focused Access (30-60 Days)</span>
            </div>
            <div class="feat-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Instant Card or Bank Wire with Verified Receipt</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Catalog Controls -->
      <section class="catalog-section">
        <div class="container">
          <div class="catalog-header">
            <div>
              <h2>Monthly Accounting Courses</h2>
              <p class="text-secondary">Enroll in this month's cohort or explore past masterclass archives</p>
            </div>

            <div class="catalog-filters">
              <div class="search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search syllabus or topics..."
                  [(ngModel)]="searchQuery"
                  class="search-input" />
              </div>

              <!-- Month filter pill tabs -->
              <div class="month-tabs">
                <button
                  class="month-tab-btn"
                  [class.active]="selectedMonth === 'ALL'"
                  (click)="selectedMonth = 'ALL'">
                  All Batches
                </button>
                @for (m of uniqueMonths(); track m) {
                  <button
                    class="month-tab-btn"
                    [class.active]="selectedMonth === m"
                    (click)="selectedMonth = m">
                    {{ m }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Courses Grid -->
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading catalog...</p>
            </div>
          } @else if (filteredCourses().length === 0) {
            <div class="empty-state card">
              <p>No courses match your filter criteria.</p>
            </div>
          } @else {
            <div class="courses-grid">
              @for (course of filteredCourses(); track course.id) {
                <div class="course-card card card-hover">
                  <div class="card-top">
                    <div class="batch-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {{ course.monthYear }}
                    </div>
                    <span class="course-code mono-num">{{ course.courseCode }}</span>
                  </div>

                  <h3 class="course-title">{{ course.title }}</h3>
                  <p class="course-desc">{{ course.description }}</p>

                  <div class="course-meta-tags">
                    <span class="meta-tag">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {{ course.accessDurationDays }} Days Access
                    </span>
                    <span class="meta-tag">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      {{ course.modulesCount }} Modules ({{ course.lessonsCount }} Lessons)
                    </span>
                  </div>

                  <div class="card-footer">
                    <div class="price-container">
                      <span class="price-type">One-Time Enrolment</span>
                      <span class="price-val mono-num">\${{ course.price | number:'1.2-2' }}</span>
                    </div>

                    <div class="card-actions">
                      <button (click)="viewSyllabus(course)" class="btn btn-outline btn-sm">
                        Syllabus
                      </button>

                      @if (course.isEnrolled) {
                        <a [routerLink]="['/student/learn', course.id]" class="btn btn-emerald btn-sm">
                          Go to Classroom
                        </a>
                      } @else {
                        <button (click)="openCheckout(course)" class="btn btn-primary btn-sm">
                          Enroll Now
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Syllabus Preview Modal -->
      @if (syllabusCourse()) {
        <div class="modal-overlay" (click)="onSyllabusBackdrop($event)">
          <div class="modal-content modal-content-lg syllabus-modal">
            <button class="modal-close" (click)="syllabusCourse.set(null)" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div class="syllabus-header">
              <span class="badge badge-indigo">{{ syllabusCourse()?.monthYear }}</span>
              <h2>{{ syllabusCourse()?.title }}</h2>
              <p class="text-secondary">{{ syllabusCourse()?.description }}</p>
            </div>

            <div class="syllabus-modules">
              <h4>Class Curriculum & Syllabus Breakdown</h4>
              @for (mod of syllabusDetails()?.modules; track mod.id) {
                <div class="syllabus-module-box">
                  <div class="module-title-bar">
                    <span class="mod-num">Module {{ mod.orderIndex }}</span>
                    <h5>{{ mod.title }}</h5>
                  </div>
                  <div class="module-lessons-list">
                    @for (lesson of mod.lessons; track lesson.id) {
                      <div class="lesson-preview-row">
                        <div class="lesson-left">
                          <span class="type-icon" [ngSwitch]="lesson.contentType">
                            <svg *ngSwitchCase="1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            <svg *ngSwitchCase="2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <svg *ngSwitchCase="3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <svg *ngSwitchCase="4" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </span>
                          <span class="lesson-name">{{ lesson.title }}</span>
                        </div>
                        <span class="lesson-duration mono-num" *ngIf="lesson.durationMinutes">
                          {{ lesson.durationMinutes }}m
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="syllabus-footer">
              <div class="footer-price">
                <span>Tuition:</span>
                <strong class="mono-num text-emerald">\${{ syllabusCourse()?.price | number:'1.2-2' }}</strong>
                <span class="text-muted">({{ syllabusCourse()?.accessDurationDays }} Days Access)</span>
              </div>
              @if (syllabusCourse()?.isEnrolled) {
                <a [routerLink]="['/student/learn', syllabusCourse()?.id]" class="btn btn-emerald btn-lg">
                  Enter Classroom
                </a>
              } @else {
                <button (click)="openCheckoutFromSyllabus()" class="btn btn-primary btn-lg">
                  Enroll in This Course
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Checkout Modal -->
      @if (selectedCheckoutCourse()) {
        <app-checkout-modal
          [course]="selectedCheckoutCourse()!"
          (close)="selectedCheckoutCourse.set(null)"
          (completed)="onCheckoutCompleted($event)">
        </app-checkout-modal>
      }
    </div>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
      border-bottom: 1px solid var(--border-subtle);
      padding: 5rem 0 4rem;
      text-align: center;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.775rem;
      font-weight: 700;
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hero-title {
      font-size: 3.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
      max-width: 850px;
      margin-left: auto;
      margin-right: auto;
      color: var(--text-primary);
    }

    .gradient-text {
      background: linear-gradient(135deg, #4f46e5 0%, #059669 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      color: var(--text-secondary);
      max-width: 720px;
      margin: 0 auto 2.5rem;
      line-height: 1.6;
    }

    .hero-features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 2rem;
    }

    .feat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    .catalog-section {
      padding: 3.5rem 0 5rem;
    }

    .catalog-header {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    @media (min-width: 768px) {
      .catalog-header {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .catalog-filters {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    @media (min-width: 768px) {
      .catalog-filters {
        align-items: flex-end;
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.5rem 1rem;
      width: 100%;
      max-width: 320px;
      color: var(--text-secondary);
      box-shadow: var(--shadow-sm);
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.9rem;
      width: 100%;
      outline: none;
    }

    .month-tabs {
      display: flex;
      gap: 0.4rem;
      background: #ffffff;
      padding: 4px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
    }

    .month-tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
    }

    .month-tab-btn:hover {
      color: var(--text-primary);
    }

    .month-tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.75rem;
    }

    .course-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .batch-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: #3730a3;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-sm);
    }

    .course-code {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .course-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      line-height: 1.35;
      color: var(--text-primary);
    }

    .course-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.775rem;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }

    .card-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .price-container {
      display: flex;
      flex-direction: column;
    }

    .price-type {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .price-val {
      font-size: 1.4rem;
      font-weight: 800;
      color: #059669;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .syllabus-modal {
      position: relative;
      background: #ffffff;
    }

    .modal-close {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: #f1f5f9;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .modal-close:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .syllabus-header {
      margin-bottom: 1.5rem;
    }

    .syllabus-header h2 {
      margin: 0.5rem 0;
      color: var(--text-primary);
    }

    .syllabus-modules {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .syllabus-modules h4 {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-bottom: 0.5rem;
    }

    .syllabus-module-box {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .module-title-bar {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mod-num {
      font-size: 0.75rem;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
    }

    .module-lessons-list {
      padding: 0.5rem 0;
    }

    .lesson-preview-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .lesson-preview-row:last-child {
      border-bottom: none;
    }

    .lesson-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .lesson-duration {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .syllabus-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-price {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .footer-price strong {
      font-size: 1.5rem;
      color: #059669;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class CatalogComponent {
  courseService = inject(CourseService);
  authService = inject(AuthService);
  router = inject(Router);

  courses = signal<Course[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedMonth = 'ALL';

  syllabusCourse = signal<Course | null>(null);
  syllabusDetails = signal<CourseDetail | null>(null);

  selectedCheckoutCourse = signal<Course | null>(null);

  uniqueMonths = computed(() => {
    const list = this.courses().map(c => c.monthYear);
    return Array.from(new Set(list));
  });

  filteredCourses = computed(() => {
    return this.courses().filter(c => {
      const matchSearch = !this.searchQuery ||
        c.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchMonth = this.selectedMonth === 'ALL' || c.monthYear === this.selectedMonth;

      return matchSearch && matchMonth;
    });
  });

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load courses', err);
        this.loading.set(false);
      }
    });
  }

  viewSyllabus(course: Course) {
    this.syllabusCourse.set(course);
    this.courseService.getCourseDetails(course.id).subscribe({
      next: (details) => this.syllabusDetails.set(details),
      error: (err) => console.error('Failed to load syllabus', err)
    });
  }

  onSyllabusBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.syllabusCourse.set(null);
    }
  }

  openCheckout(course: Course) {
    if (!this.authService.isLoggedIn()) {
      // Direct quick login for demo convenience, or navigate to login
      this.authService.quickLoginAs('student').subscribe(() => {
        this.selectedCheckoutCourse.set(course);
      });
      return;
    }
    this.selectedCheckoutCourse.set(course);
  }

  openCheckoutFromSyllabus() {
    const c = this.syllabusCourse();
    if (c) {
      this.syllabusCourse.set(null);
      this.openCheckout(c);
    }
  }

  onCheckoutCompleted(event: { navigateToPlayer: boolean; courseId: string }) {
    this.selectedCheckoutCourse.set(null);
    this.loadCourses();

    if (event.navigateToPlayer) {
      this.router.navigate(['/student/learn', event.courseId]);
    } else {
      this.router.navigate(['/student/my-courses']);
    }
  }
}
