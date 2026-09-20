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
        <button class="modal-close" (click)="close.emit()" title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        @if (paymentSuccess()) {
          <div class="success-state">
            <div class="success-icon" [class.success-amber]="completedPayment()?.status === 1">
              <svg *ngIf="completedPayment()?.status === 2" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <svg *ngIf="completedPayment()?.status === 1" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
            </div>

            <h3 *ngIf="completedPayment()?.status === 2">Payment Successful!</h3>
            <h3 *ngIf="completedPayment()?.status === 1">Bank Transfer Slip Submitted!</h3>

            <p class="success-desc" *ngIf="completedPayment()?.status === 2">
              You are now officially enrolled in <strong>{{ course.title }}</strong> with <strong>{{ course.accessDurationDays }} days</strong> of access.
            </p>
            <p class="success-desc" *ngIf="completedPayment()?.status === 1">
              Your bank transfer reference <strong>{{ completedPayment()?.transactionRef }}</strong> and receipt have been submitted to Prof. Vance. You will receive immediate classroom access once approved!
            </p>

            <div class="invoice-summary" *ngIf="completedPayment()?.invoice">
              <div class="invoice-row">
                <span>Invoice Number:</span>
                <span class="mono-num">{{ completedPayment()?.invoice?.invoiceNumber }}</span>
              </div>
              <div class="invoice-row">
                <span>Amount Paid:</span>
                <span class="mono-num text-emerald">\${{ completedPayment()?.invoice?.total | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="success-actions">
              <button *ngIf="completedPayment()?.status === 2" (click)="onSuccessDone(true)" class="btn btn-emerald btn-lg">
                Enter Classroom Player
              </button>
              <button (click)="onSuccessDone(false)" class="btn btn-secondary btn-lg">
                View My Dashboard
              </button>
            </div>
          </div>
        } @else {
          <div class="checkout-header">
            <div class="course-badge">{{ course.monthYear }} Masterclass</div>
            <h2>Enroll in {{ course.title }}</h2>
            <div class="course-meta-pills">
              <span class="meta-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                {{ course.accessDurationDays }} Days Access
              </span>
              <span class="meta-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                {{ course.modulesCount }} Modules &bull; {{ course.lessonsCount }} Lessons
              </span>
            </div>
          </div>

          <div class="price-banner">
            <span class="price-label">One-Time Course Fee</span>
            <span class="price-value mono-num">\${{ course.price | number:'1.2-2' }}</span>
          </div>

          <!-- Payment Tabs -->
          <div class="payment-tabs">
            <button
              type="button"
              class="tab-btn"
              [class.active]="selectedTab === 'card'"
              (click)="selectedTab = 'card'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              Instant Online Checkout
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="selectedTab === 'bank'"
              (click)="selectedTab = 'bank'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Bank Transfer / Slip Upload
            </button>
          </div>

          <!-- Tab 1: Instant Card Checkout -->
          @if (selectedTab === 'card') {
            <form (ngSubmit)="handleInstantCheckout()" class="checkout-form">
              <div class="form-group">
                <label class="form-label">Name on Card</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="cardHolderName"
                  name="cardHolder"
                  placeholder="e.g. Alex Reynolds"
                  required />
              </div>

              <div class="form-group">
                <label class="form-label">Card Number (Simulation Mode)</label>
                <div class="card-input-wrapper">
                  <input
                    type="text"
                    class="form-control mono-num"
                    [(ngModel)]="cardNumber"
                    name="cardNumber"
                    placeholder="4242 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242"
                    required />
                  <span class="card-chip">TEST VISA</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label class="form-label">Expiry</label>
                  <input type="text" class="form-control mono-num" [(ngModel)]="expiry" name="expiry" placeholder="MM/YY" />
                </div>
                <div class="form-group half">
                  <label class="form-label">CVC</label>
                  <input type="text" class="form-control mono-num" [(ngModel)]="cvc" name="cvc" placeholder="CVC" />
                </div>
              </div>

              <div class="instant-guarantee">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <span>Instant activation: Gain classroom access immediately upon clicking Pay.</span>
              </div>

              <button type="submit" [disabled]="loading()" class="btn btn-emerald btn-lg w-full">
                @if (loading()) {
                  <span>Processing...</span>
                } @else {
                  <span>Pay \${{ course.price | number:'1.2-2' }} & Activate Course</span>
                }
              </button>
            </form>
          }

          <!-- Tab 2: Bank Transfer -->
          @if (selectedTab === 'bank') {
            <div class="bank-transfer-container">
              <!-- Bank details display -->
              <div class="bank-details-box">
                <h4>Official Instructor Bank Details</h4>
                <div class="bank-grid">
                  <div class="bank-item">
                    <span class="label">Bank Name:</span>
                    <span class="val">{{ bankDetails?.bankName || 'Bank of Accounting & Finance' }}</span>
                  </div>
                  <div class="bank-item">
                    <span class="label">Beneficiary Name:</span>
                    <span class="val">{{ bankDetails?.accountHolder || 'Prof. Marcus Vance, CPA' }}</span>
                  </div>
                  <div class="bank-item">
                    <span class="label">Account Number:</span>
                    <span class="val mono-num">{{ bankDetails?.accountNumber || '9820-4100-8841-2900' }}</span>
                  </div>
                  <div class="bank-item">
                    <span class="label">SWIFT / Routing:</span>
                    <span class="val mono-num">{{ bankDetails?.routingOrSwift || 'BAFUS33XX' }}</span>
                  </div>
                </div>
                <p class="bank-note">{{ bankDetails?.transferInstructions }}</p>
              </div>

              <form (ngSubmit)="handleBankTransferSubmit()" class="checkout-form">
                <div class="form-group">
                  <label class="form-label">Transfer Transaction / Reference Number *</label>
                  <input
                    type="text"
                    class="form-control mono-num"
                    [(ngModel)]="bankRef"
                    name="bankRef"
                    placeholder="e.g. WIRE-8849201 or REF123456"
                    required />
                </div>

                <div class="form-group">
                  <label class="form-label">Upload Bank Slip / Receipt (Image or PDF) *</label>
                  <div class="file-upload-box" [class.file-selected]="slipFile">
                    <input
                      type="file"
                      id="slipFileInput"
                      (change)="onFileSelected($event)"
                      accept="image/*,application/pdf"
                      class="file-input-hidden" />
                    <label for="slipFileInput" class="file-upload-label">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <span *ngIf="!slipFile">Click to upload deposit slip / wire receipt</span>
                      <span *ngIf="slipFile" class="file-name-text">{{ slipFile.name }} ({{ (slipFile.size / 1024).toFixed(0) }} KB)</span>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Optional Notes for Instructor</label>
                  <textarea
                    class="form-control"
                    [(ngModel)]="bankNotes"
                    name="bankNotes"
                    rows="2"
                    placeholder="Any specific note regarding your wire or bank deposit..."></textarea>
                </div>

                <button type="submit" [disabled]="loading() || !bankRef || !slipFile" class="btn btn-primary btn-lg w-full">
                  @if (loading()) {
                    <span>Uploading & Submitting...</span>
                  } @else {
                    <span>Submit Slip for Teacher Verification</span>
                  }
                </button>
              </form>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .checkout-modal {
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
      transition: var(--transition);
    }

    .modal-close:hover {
      background: #fee2e2;
      color: #ef4444;
    }

    .checkout-header {
      margin-bottom: 1.25rem;
    }

    .course-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4f46e5;
      margin-bottom: 0.25rem;
    }

    .course-meta-pills {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      background: #f1f5f9;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .price-banner {
      background: linear-gradient(135deg, #eef2ff 0%, #ecfdf5 100%);
      border: 1px solid #c7d2fe;
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .price-label {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .price-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #059669;
    }

    .payment-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 4px;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-subtle);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.65rem;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition);
    }

    .tab-btn.active {
      background: #ffffff;
      color: var(--text-primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-row .half {
      flex: 1;
    }

    .card-input-wrapper {
      position: relative;
    }

    .card-chip {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      color: #4f46e5;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .instant-guarantee {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.825rem;
      color: #065f46;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
    }

    .bank-details-box {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .bank-details-box h4 {
      font-size: 0.95rem;
      color: #b45309;
      margin-bottom: 0.75rem;
    }

    .bank-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      font-size: 0.825rem;
      margin-bottom: 0.75rem;
    }

    .bank-item {
      display: flex;
      flex-direction: column;
    }

    .bank-item .label {
      color: var(--text-muted);
      font-size: 0.725rem;
    }

    .bank-item .val {
      color: var(--text-primary);
      font-weight: 600;
    }

    .bank-note {
      font-size: 0.785rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.65rem;
      font-style: italic;
    }

    .file-upload-box {
      border: 2px dashed #cbd5e1;
      border-radius: var(--radius-md);
      padding: 1.5rem;
      text-align: center;
      transition: var(--transition);
      cursor: pointer;
      background: #f8fafc;
    }

    .file-upload-box:hover, .file-upload-box.file-selected {
      border-color: #4f46e5;
      background: #eef2ff;
    }

    .file-input-hidden {
      display: none;
    }

    .file-upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .file-name-text {
      color: #0284c7;
      font-weight: 600;
    }

    .w-full {
      width: 100%;
    }

    .success-state {
      text-align: center;
      padding: 2rem 1rem;
    }

    .success-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #ecfdf5;
      border: 2px solid #10b981;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
    }

    .success-icon.success-amber {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #d97706;
    }

    .success-desc {
      color: var(--text-secondary);
      max-width: 480px;
      margin: 0.75rem auto 1.5rem;
      font-size: 0.95rem;
    }

    .invoice-summary {
      background: #f8fafc;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1rem;
      max-width: 360px;
      margin: 0 auto 1.5rem;
      text-align: left;
    }

    .invoice-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding: 0.25rem 0;
    }

    .success-actions {
      display: flex;
      gap: 1rem;
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

  selectedTab: 'card' | 'bank' = 'card';
  loading = signal(false);
  paymentSuccess = signal(false);
  completedPayment = signal<Payment | null>(null);

  bankDetails: BankDetails | null = null;

  // Card form
  cardHolderName = this.authService.currentUser()?.fullName || 'Alex Reynolds';
  cardNumber = '4242 •••• •••• 4242';
  expiry = '12/28';
  cvc = '889';

  // Bank form
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

  handleInstantCheckout() {
    this.loading.set(true);
    this.paymentService.instantCheckout({
      courseId: this.course.id,
      cardHolderName: this.cardHolderName,
      cardNumberLast4: '4242'
    }).subscribe({
      next: (payment) => {
        this.loading.set(false);
        this.completedPayment.set(payment);
        this.paymentSuccess.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.message || 'Checkout failed. Please try again.');
      }
    });
  }

  handleBankTransferSubmit() {
    if (!this.slipFile) {
      alert('Please upload a transfer receipt/slip file.');
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
