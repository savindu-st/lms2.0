import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Payment } from '../../../core/models/models';
import { TeacherService } from '../../../core/services/teacher.service';

@Component({
  selector: 'app-bank-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container verification-page">
      <div class="page-header">
        <div>
          <h1>Bank Transfer Verification Desk</h1>
          <p class="text-secondary">Verify incoming wire deposits and bank slips. Approving activates immediate student classroom access and generates a tax invoice.</p>
        </div>
      </div>

      <!-- Pending Queue Header -->
      <div class="section-title-bar">
        <h3>Pending Verifications ({{ pendingPayments().length }})</h3>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading pending bank slips...</p>
        </div>
      } @else if (pendingPayments().length === 0) {
        <div class="empty-state card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon text-emerald"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          <h3>All Bank Transfers Verified</h3>
          <p class="text-secondary">There are no pending deposit slips awaiting review at this time.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course Cohort</th>
                <th>Amount</th>
                <th>Transaction Ref</th>
                <th>Date & Receipt</th>
                <th>Student Note</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (pay of pendingPayments(); track pay.id) {
                <tr>
                  <td>
                    <strong>{{ pay.studentName }}</strong>
                    <div class="text-muted mono-num" style="font-size: 0.75rem;">{{ pay.studentEmail }}</div>
                  </td>
                  <td>
                    <span class="font-medium">{{ pay.courseTitle }}</span>
                  </td>
                  <td class="mono-num font-bold text-primary">\${{ pay.amount | number:'1.2-2' }}</td>
                  <td class="mono-num font-bold text-amber">{{ pay.transactionRef }}</td>
                  <td>
                    <div class="slip-cell">
                      <span class="text-muted" style="font-size: 0.75rem;">{{ pay.transferDate | date:'short' }}</span>
                      @if (pay.slipFileUrl) {
                        <button (click)="inspectSlip(pay)" class="btn btn-outline btn-sm">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          Inspect Slip
                        </button>
                      } @else {
                        <span class="text-muted" style="font-size: 0.75rem;">No receipt attached</span>
                      }
                    </div>
                  </td>
                  <td class="notes-cell">
                    <span class="text-secondary">{{ pay.teacherNotes || 'None provided' }}</span>
                  </td>
                  <td>
                    <div class="verify-btn-group">
                      <button (click)="approvePayment(pay)" class="btn btn-emerald btn-sm" [disabled]="processingId() === pay.id">
                        Approve & Enroll
                      </button>
                      <button (click)="openRejectModal(pay)" class="btn btn-danger btn-sm" [disabled]="processingId() === pay.id">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Slip Inspection Modal -->
      @if (activeInspectPayment()) {
        <div class="modal-overlay" (click)="activeInspectPayment.set(null)">
          <div class="modal-content modal-content-lg" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="activeInspectPayment.set(null)" title="Close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Inspect Deposit Slip / Wire Receipt</h3>
            <p class="text-secondary" style="margin-bottom: 1.25rem; font-size: 0.8125rem;">
              Submitted by <strong>{{ activeInspectPayment()?.studentName }}</strong> for <strong>{{ activeInspectPayment()?.courseTitle }}</strong>.
            </p>

            <div class="slip-preview-container card">
              <div class="slip-meta-header">
                <div>
                  <span class="label">Reference No:</span>
                  <strong class="mono-num text-amber font-bold">{{ activeInspectPayment()?.transactionRef }}</strong>
                </div>
                <div>
                  <span class="label">Course Fee:</span>
                  <strong class="mono-num text-primary font-bold">\${{ activeInspectPayment()?.amount | number:'1.2-2' }}</strong>
                </div>
              </div>

              <div class="slip-media-box">
                <a [href]="activeInspectPayment()?.slipFileUrl" target="_blank" class="slip-link">
                  <div class="slip-doc-placeholder">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <h4>{{ activeInspectPayment()?.originalSlipFileName || 'Deposit_Receipt.pdf' }}</h4>
                    <span>Click to open or download original high-res slip file &rarr;</span>
                  </div>
                </a>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
              <button (click)="activeInspectPayment.set(null)" class="btn btn-outline btn-sm">Close</button>
              <button (click)="approvePayment(activeInspectPayment()!)" class="btn btn-emerald btn-sm">
                Approve Transfer & Enroll Student
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Reject Modal -->
      @if (rejectingPayment()) {
        <div class="modal-overlay" (click)="rejectingPayment.set(null)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="rejectingPayment.set(null)" title="Close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Reject Bank Transfer</h3>
            <p class="text-secondary" style="margin-bottom: 1.25rem; font-size: 0.8125rem;">
              Provide a reason note so {{ rejectingPayment()?.studentName }} can resolve the wire transaction mismatch.
            </p>

            <form (ngSubmit)="confirmReject()">
              <div class="form-group">
                <label class="form-label">Rejection Reason *</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="rejectNotes"
                  name="rNotes"
                  rows="3"
                  placeholder="e.g. Reference number could not be located on the bank statement. Please verify and resubmit."
                  required></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" (click)="rejectingPayment.set(null)" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-danger btn-sm">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .verification-page {
      padding: 2.5rem 1.5rem 5rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .section-title-bar {
      margin-bottom: 1rem;
    }

    .section-title-bar h3 {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .slip-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      align-items: flex-start;
    }

    .notes-cell {
      max-width: 200px;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .verify-btn-group {
      display: flex;
      gap: 0.35rem;
    }

    .slip-preview-container {
      background: var(--bg-card);
      padding: 1.25rem;
    }

    .slip-meta-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
      font-size: 0.8125rem;
    }

    .slip-meta-header .label {
      color: var(--text-muted);
      margin-right: 0.35rem;
    }

    .slip-media-box {
      text-align: center;
      padding: 1.5rem 1rem;
    }

    .slip-link {
      text-decoration: none;
      display: inline-block;
    }

    .slip-doc-placeholder {
      background: var(--bg-subtle);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-primary);
      transition: var(--transition);
    }

    .slip-doc-placeholder:hover {
      border-color: var(--border-focus);
      background: #ffffff;
    }

    .slip-doc-placeholder h4 {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .slip-doc-placeholder span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class BankVerificationComponent {
  teacherService = inject(TeacherService);

  pendingPayments = signal<Payment[]>([]);
  loading = signal(true);
  processingId = signal<string | null>(null);

  activeInspectPayment = signal<Payment | null>(null);
  rejectingPayment = signal<Payment | null>(null);
  rejectNotes = '';

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.loading.set(true);
    this.teacherService.getPendingBankTransfers().subscribe({
      next: (data) => {
        this.pendingPayments.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  inspectSlip(payment: Payment) {
    this.activeInspectPayment.set(payment);
  }

  approvePayment(payment: Payment) {
    this.processingId.set(payment.id);
    this.teacherService.verifyBankTransfer(payment.id, true).subscribe({
      next: () => {
        this.processingId.set(null);
        if (this.activeInspectPayment()?.id === payment.id) {
          this.activeInspectPayment.set(null);
        }
        this.loadPending();
      },
      error: (err) => {
        this.processingId.set(null);
        alert(err.error?.message || 'Failed to approve payment.');
      }
    });
  }

  openRejectModal(payment: Payment) {
    this.rejectingPayment.set(payment);
    this.rejectNotes = 'Reference number could not be found on bank account statement.';
  }

  confirmReject() {
    const pay = this.rejectingPayment();
    if (!pay) return;

    this.processingId.set(pay.id);
    this.teacherService.verifyBankTransfer(pay.id, false, this.rejectNotes).subscribe({
      next: () => {
        this.processingId.set(null);
        this.rejectingPayment.set(null);
        this.loadPending();
      },
      error: (err) => {
        this.processingId.set(null);
        alert(err.error?.message || 'Failed to reject payment.');
      }
    });
  }
}
