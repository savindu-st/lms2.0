import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Course, CourseDetail } from '../../core/models/models';
import { CourseService } from '../../core/services/course.service';
import { AuthService } from '../../core/services/auth.service';
import { SystemService } from '../../core/services/system.service';
import { CheckoutModalComponent } from '../../shared/components/checkout-modal/checkout-modal';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CheckoutModalComponent],
  template: `
    <div class="catalog-page">
      <!-- Minimalist SaaS Hero Section -->
      <section class="hero-section">
        <div class="container hero-content">
          <h1 class="hero-title">
            Master Accounting & Finance with <span class="title-highlight">Expert-Led Courses</span>
          </h1>
          <p class="hero-subtitle">
            Structured, career-focused masterclasses covering core accounting principles, financial statement analysis, and practical real-world applications.
          </p>

          <div class="hero-features">
            <div class="feat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="feat-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Structured Curriculum & Modular Lessons</span>
            </div>
            <div class="feat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="feat-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Time-Limited Focused Access with Progress Tracking</span>
            </div>
            <div class="feat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="feat-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Direct Bank Wire Deposit with Official Tax Invoice</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Catalog Controls & Courses Grid -->
      <section class="catalog-section">
        <div class="container">
          <div class="catalog-header">
            <div class="catalog-heading-wrap">
              <h2>Available Masterclasses</h2>
              <p class="text-secondary">Explore current cohort offerings and syllabus archives</p>
            </div>

            <div class="catalog-filters">
              <div class="search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search syllabus, code or topic..."
                  [(ngModel)]="searchQuery"
                  class="search-input" />
              </div>

              <!-- Segmented Control Month Tabs -->
              <div class="segmented-control">
                <button
                  class="segmented-btn"
                  [class.active]="selectedMonth === 'ALL'"
                  (click)="selectedMonth = 'ALL'">
                  All Batches
                </button>
                @for (m of uniqueMonths(); track m) {
                  <button
                    class="segmented-btn"
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
              <p>Loading course catalog...</p>
            </div>
          } @else if (filteredCourses().length === 0) {
            <div class="empty-state card">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <h3 *ngIf="courses().length === 0">No courses published yet</h3>
              <p class="text-secondary" *ngIf="courses().length === 0">
                Please check back soon for upcoming masterclasses, or sign in as an instructor to publish a new course.
              </p>
              <p *ngIf="courses().length > 0">No courses match your filter criteria.</p>
              @if (authService.isTeacher()) {
                <a routerLink="/teacher/courses" class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">
                  Open Course Studio
                </a>
              }
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
                      <span class="price-type">Tuition Fee</span>
                      <span class="price-val mono-num">\${{ course.price | number:'1.2-2' }}</span>
                    </div>

                    <div class="card-actions">
                      <button (click)="viewSyllabus(course)" class="btn btn-outline btn-sm">
                        Syllabus
                      </button>

                      @if (course.isEnrolled) {
                        <a [routerLink]="['/student/learn', course.id]" class="btn btn-emerald btn-sm">
                          Classroom &rarr;
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
            <button class="modal-close" (click)="syllabusCourse.set(null)" title="Close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div class="syllabus-header">
              <div class="badge badge-zinc" style="margin-bottom: 0.5rem;">{{ syllabusCourse()?.monthYear }} Masterclass</div>
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
                            <svg *ngSwitchCase="1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-cyan"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            <svg *ngSwitchCase="2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <svg *ngSwitchCase="3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <svg *ngSwitchCase="4" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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
                <span class="text-secondary">Tuition:</span>
                <strong class="mono-num text-emerald">\${{ syllabusCourse()?.price | number:'1.2-2' }}</strong>
                <span class="text-muted" style="font-size: 0.8125rem;">({{ syllabusCourse()?.accessDurationDays }} Days Access)</span>
              </div>
              @if (syllabusCourse()?.isEnrolled) {
                <a [routerLink]="['/student/learn', syllabusCourse()?.id]" class="btn btn-emerald btn-lg">
                  Enter Classroom &rarr;
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
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      padding: 4.5rem 0 3.75rem;
      text-align: center;
    }

    .hero-title {
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.035em;
      margin-bottom: 1.25rem;
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
      color: var(--text-primary);
      line-height: 1.15;
    }

    .title-highlight {
      color: var(--text-primary);
      position: relative;
    }

    .hero-subtitle {
      font-size: 1.05rem;
      color: var(--text-secondary);
      max-width: 660px;
      margin: 0 auto 2.25rem;
      line-height: 1.6;
    }

    .hero-features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1.75rem;
    }

    .feat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .feat-icon {
      color: var(--emerald);
      flex-shrink: 0;
    }

    .catalog-section {
      padding: 3rem 0 5rem;
    }

    .catalog-header {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    @media (min-width: 768px) {
      .catalog-header {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
      }
    }

    .catalog-heading-wrap h2 {
      margin-bottom: 0.25rem;
    }

    .catalog-filters {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
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
      padding: 0.45rem 0.75rem;
      width: 100%;
      max-width: 300px;
      color: var(--text-muted);
      box-shadow: var(--shadow-xs);
      transition: var(--transition);
    }

    .search-box:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 1px var(--border-focus);
    }

    .search-icon {
      flex-shrink: 0;
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.8125rem;
      width: 100%;
      outline: none;
      font-family: var(--font-sans);
    }

    .search-input::placeholder {
      color: #a1a1aa;
    }

    /* Segmented Control */
    .segmented-control {
      display: flex;
      background: var(--bg-subtle);
      padding: 3px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      overflow-x: auto;
      max-width: 100%;
    }

    .segmented-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.3rem 0.75rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition);
      font-family: var(--font-sans);
    }

    .segmented-btn:hover {
      color: var(--text-primary);
    }

    .segmented-btn.active {
      background: #ffffff;
      color: var(--text-primary);
      font-weight: 600;
      box-shadow: var(--shadow-xs);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
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
      margin-bottom: 0.75rem;
    }

    .batch-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .course-code {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .course-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      line-height: 1.35;
      color: var(--text-primary);
    }

    .course-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 1.25rem;
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      background: var(--bg-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }

    .card-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .price-container {
      display: flex;
      flex-direction: column;
    }

    .price-type {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .price-val {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .card-actions {
      display: flex;
      gap: 0.4rem;
    }

    /* Syllabus Modal */
    .syllabus-modal {
      position: relative;
    }

    .syllabus-header {
      margin-bottom: 1.5rem;
    }

    .syllabus-header h2 {
      margin: 0.35rem 0;
      color: var(--text-primary);
    }

    .syllabus-modules {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.75rem;
    }

    .syllabus-modules h4 {
      font-size: 0.875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.25rem;
    }

    .syllabus-module-box {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .module-title-bar {
      background: var(--bg-subtle);
      padding: 0.6rem 0.85rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .module-title-bar h5 {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .mod-num {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .module-lessons-list {
      padding: 0.25rem 0;
    }

    .lesson-preview-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.85rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .lesson-preview-row:last-child {
      border-bottom: none;
    }

    .lesson-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-primary);
    }

    .lesson-duration {
      font-size: 0.6875rem;
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
      gap: 0.35rem;
    }

    .footer-price strong {
      font-size: 1.25rem;
      color: var(--text-primary);
    }
  `]
})
export class CatalogComponent {
  courseService = inject(CourseService);
  authService = inject(AuthService);
  systemService = inject(SystemService);
  router = inject(Router);
  route = inject(ActivatedRoute);

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

        // Check for return from login with pending enroll course
        const enrollId = this.route.snapshot.queryParams['enroll'];
        if (enrollId && this.authService.isLoggedIn()) {
          const target = data.find(c => c.id === enrollId);
          if (target && !target.isEnrolled) {
            this.selectedCheckoutCourse.set(target);
          }
        }
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
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/', enrollCourseId: course.id }
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
