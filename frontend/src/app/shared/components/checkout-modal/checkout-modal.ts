import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Course, BankDetails, Payment } from '../../../core/models/models';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-content modal-content-lg checkout-modal">
        <!-- Close button -->
        <button class="modal-close" (click)="close.emit()" title="Close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        @if (paymentSuccess()) {
          <div class="success-state">
            <div class="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-emerald">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>

            <h3>Bank Wire Receipt Submitted</h3>

            <p class="success-desc">
              Your transaction reference <strong class="mono-num">{{ completedPayment()?.transactionRef }}</strong> and receipt slip have been forwarded to the instructor. Your classroom enrollment will activate immediately upon verification.
            </p>

            <div class="success-actions">
              <button (click)="onSuccessDone(false)" class="btn btn-primary btn-sm">
                Go to My Classroom &rarr;
              </button>
            </div>
          </div>
        } @else {
          <div class="checkout-header">
            <div class="badge badge-zinc" style="margin-bottom: 0.35rem;">{{ course.monthYear }} Cohort</div>
            <h2>Enroll in {{ course.title }}</h2>
            <div class="course-meta-pills">
              <span class="meta-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {{ course.accessDurationDays }} Days Access
              </span>
              <span class="meta-pill">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                {{ course.modulesCount }} Modules &bull; {{ course.lessonsCount }} Lessons
              </span>
            </div>
          </div>

          <div class="price-banner">
            <span class="price-label">Tuition Fee</span>
            <span class="price-value mono-num">\${{ course.price | number:'1.2-2' }}</span>
          </div>

          <!-- Official Bank Transfer & Slip Submission -->
          <div class="bank-transfer-container">
            <div class="bank-details-box">
              <h4>Official Academy Wire Coordinates</h4>
              @if (bankDetails?.accountNumber) {
                <div class="bank-grid">
                  <div class="bank-item" *ngIf="bankDetails?.bankName">
                    <span class="label">Bank Name</span>
                    <span class="val">{{ bankDetails?.bankName }}</span>
                  </div>
                  <div class="bank-item" *ngIf="bankDetails?.accountHolder">
                    <span class="label">Beneficiary</span>
                    <span class="val">{{ bankDetails?.accountHolder }}</span>
                  </div>
                  <div class="bank-item">
                    <span class="label">Account Number</span>
                    <span class="val mono-num font-bold">{{ bankDetails?.accountNumber }}</span>
                  </div>
                  <div class="bank-item" *ngIf="bankDetails?.routingOrSwift">
                    <span class="label">SWIFT / Routing</span>
                    <span class="val mono-num">{{ bankDetails?.routingOrSwift }}</span>
                  </div>
                </div>
                <p class="bank-note" *ngIf="bankDetails?.transferInstructions">{{ bankDetails?.transferInstructions }}</p>
              } @else {
                <p class="text-secondary" style="font-size: 0.8125rem; margin-bottom: 0.35rem;">
                  {{ bankDetails?.transferInstructions || 'Please transfer the tuition fee using your preferred online banking or bank branch wire.' }}
                </p>
                <p class="bank-note">Once you execute the wire, upload your transfer slip below to request verification.</p>
              }
            </div>

            <form (ngSubmit)="handleBankTransferSubmit()" class="checkout-form">
              <div class="form-group">
                <label class="form-label">Wire Transaction / Reference Number *</label>
                <input
                  type="text"
                  class="form-control mono-num"
                  [(ngModel)]="bankRef"
                  name="bankRef"
                  placeholder="e.g. WIRE-8849201 or REF-123456"
                  required />
              </div>

              <div class="form-group">
                <label class="form-label">Upload Transfer Slip / Receipt (Image or PDF) *</label>
                <div class="file-upload-box" [class.file-selected]="slipFile">
                  <input
                    type="file"
                    id="slipFileInput"
                    (change)="onFileSelected($event)"
                    accept="image/*,application/pdf"
                    class="file-input-hidden" />
                  <label for="slipFileInput" class="file-upload-label">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <span *ngIf="!slipFile" class="upload-hint">Click to select receipt slip or drag and drop</span>
                    <span *ngIf="slipFile" class="file-name-text">{{ slipFile.name }} ({{ (slipFile.size / 1024).toFixed(0) }} KB)</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Optional Student Notes</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="bankNotes"
                  name="bankNotes"
                  rows="2"
                  placeholder="Note regarding student ID, sending bank branch, or payment timing..."></textarea>
              </div>

              <button type="submit" [disabled]="loading() || !bankRef || !slipFile" class="btn btn-emerald btn-lg w-full">
                @if (loading()) {
                  <span>Uploading & Submitting...</span>
                } @else {
                  <span>Submit Slip for Verification</span>
                }
              </button>
            </form>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .checkout-modal {
      position: relative;
    }

    .checkout-header {
      margin-bottom: 1.25rem;
    }

    .course-meta-pills {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      background: var(--bg-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .price-banner {
      background: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .price-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .price-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .bank-details-box {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }

    .bank-details-box h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.65rem;
    }

    .bank-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      font-size: 0.8125rem;
      margin-bottom: 0.65rem;
    }

    .bank-item {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .bank-item .label {
      color: var(--text-muted);
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .bank-item .val {
      color: var(--text-primary);
      font-weight: 600;
    }

    .bank-note {
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.5rem;
    }

    .file-upload-box {
      border: 1px dashed var(--border-hover);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      text-align: center;
      transition: var(--transition);
      cursor: pointer;
      background: var(--bg-subtle);
    }

    .file-upload-box:hover, .file-upload-box.file-selected {
      border-color: var(--border-focus);
      background: #ffffff;
    }

    .file-input-hidden {
      display: none;
    }

    .file-upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.8125rem;
    }

    .upload-hint {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .file-name-text {
      color: var(--text-primary);
      font-weight: 600;
    }

    .success-state {
      text-align: center;
      padding: 2rem 1rem;
    }

    .success-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--emerald-light);
      border: 1px solid var(--emerald-border);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .success-desc {
      color: var(--text-secondary);
      max-width: 440px;
      margin: 0.5rem auto 1.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .success-actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class CheckoutModalComponent {
  @Input({ required: true }) course!: Course;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<{ navigateToPlayer: boolean; courseId: string }>();

  paymentService = inject(PaymentService);
  authService = inject(AuthService);

  loading = signal(false);
  paymentSuccess = signal(false);
  completedPayment = signal<Payment | null>(null);

  bankDetails: BankDetails | null = null;

  bankRef = '';
  bankNotes = '';
  slipFile: File | null = null;

  ngOnInit() {
    this.paymentService.getBankDetails().subscribe({
      next: (details) => this.bankDetails = details,
      error: (err) => console.error('Failed to load bank details', err)
    });
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.slipFile = file;
    }
  }

  handleBankTransferSubmit() {
    if (!this.slipFile) {
      alert('Please select a transfer receipt / slip file to upload.');
      return;
    }

    this.loading.set(true);
    // 1. Upload file first
    this.paymentService.uploadFile(this.slipFile, 'slips').subscribe({
      next: (uploadRes) => {
        // 2. Submit payment record
        this.paymentService.submitBankTransfer({
          courseId: this.course.id,
          transactionRef: this.bankRef,
          slipFileUrl: uploadRes.fileUrl,
          originalSlipFileName: uploadRes.originalName,
          transferDate: new Date().toISOString(),
          studentNotes: this.bankNotes
        }).subscribe({
          next: (payment) => {
            this.loading.set(false);
            this.completedPayment.set(payment);
            this.paymentSuccess.set(true);
          },
          error: (err) => {
            this.loading.set(false);
            alert(err.error?.message || 'Failed to submit bank transfer.');
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        alert('File upload failed: ' + (err.error?.message || 'Network error'));
      }
    });
  }

  onSuccessDone(navigateToPlayer: boolean) {
    this.completed.emit({ navigateToPlayer, courseId: this.course.id });
  }
}
