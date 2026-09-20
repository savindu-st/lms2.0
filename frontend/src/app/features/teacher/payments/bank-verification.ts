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
          <span class="badge badge-amber">Accounting Compliance</span>
          <h1>Bank Transfer Verification Desk</h1>
          <p class="text-secondary">Verify incoming bank deposits and wire transfers. Approving activates student classroom access immediately and issues a formal tax invoice.</p>
        </div>
      </div>

      <!-- Pending Queue -->
      <div class="section-title-bar">
        <h3>Pending Verification Queue ({{ pendingPayments().length }})</h3>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading pending bank slips...</p>
        </div>
      } @else if (pendingPayments().length === 0) {
        <div class="empty-state card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" class="empty-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          <h3>All Bank Transfers Verified!</h3>
          <p class="text-secondary">No pending deposit slips awaiting review right now.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Fee</th>
                <th>Transaction Ref</th>
                <th>Date & Slip</th>
                <th>Student Notes</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (pay of pendingPayments(); track pay.id) {
                <tr>
                  <td>
                    <strong>{{ pay.studentName }}</strong>
                    <div class="text-muted mono-num" style="font-size: 0.775rem;">{{ pay.studentEmail }}</div>
                  </td>
                  <td>{{ pay.courseTitle }}</td>
                  <td class="mono-num font-bold text-emerald">\${{ pay.amount | number:'1.2-2' }}</td>
                  <td class="mono-num font-bold text-amber">{{ pay.transactionRef }}</td>
                  <td>
                    <div class="slip-cell">
                      <span class="text-muted" style="font-size: 0.75rem;">{{ pay.transferDate | date:'short' }}</span>
                      @if (pay.slipFileUrl) {
                        <button (click)="inspectSlip(pay)" class="btn btn-outline btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          Inspect Slip
                        </button>
                      } @else {
                        <span class="text-muted">No file</span>
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
            <button class="modal-close" (click)="activeInspectPayment.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Inspect Deposit Slip / Wire Receipt</h3>
            <p class="text-secondary" style="margin-bottom: 1.5rem;">
              Submitted by <strong>{{ activeInspectPayment()?.studentName }}</strong> for <strong>{{ activeInspectPayment()?.courseTitle }}</strong>.
            </p>

            <div class="slip-preview-container card">
              <div class="slip-meta-header">
                <div>
                  <span class="label">Reference No:</span>
                  <strong class="mono-num text-amber">{{ activeInspectPayment()?.transactionRef }}</strong>
                </div>
                <div>
                  <span class="label">Course Fee:</span>
                  <strong class="mono-num text-emerald">\${{ activeInspectPayment()?.amount | number:'1.2-2' }}</strong>
                </div>
              </div>

              <div class="slip-media-box">
                <a [href]="activeInspectPayment()?.slipFileUrl" target="_blank" class="slip-link">
                  <div class="slip-doc-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <h4>{{ activeInspectPayment()?.originalSlipFileName || 'Deposit_Receipt.pdf' }}</h4>
                    <span>Click to open or download original high-res slip file</span>
                  </div>
                </a>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
              <button (click)="activeInspectPayment.set(null)" class="btn btn-secondary">Close</button>
              <button (click)="approvePayment(activeInspectPayment()!)" class="btn btn-emerald">
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
            <button class="modal-close" (click)="rejectingPayment.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3>Reject Bank Transfer</h3>
            <p class="text-secondary" style="margin-bottom: 1.5rem;">
              Provide a reason note so {{ rejectingPayment()?.studentName }} can resolve the transfer mismatch.
            </p>

            <form (ngSubmit)="confirmReject()">
              <div class="form-group">
                <label class="form-label">Rejection Reason</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="rejectNotes"
                  name="rNotes"
                  rows="3"
                  placeholder="e.g. Reference number could not be located on the bank statement. Please verify and resubmit."
                  required></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                <button type="button" (click)="rejectingPayment.set(null)" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-danger">Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .verification-page {
      padding: 3rem 1.5rem 5rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
    }

    .section-title-bar {
      margin-bottom: 1.25rem;
    }

    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .font-bold { font-weight: 700; }

    .slip-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      align-items: flex-start;
    }

    .notes-cell {
      max-width: 220px;
      font-size: 0.85rem;
    }

    .verify-btn-group {
      display: flex;
      gap: 0.4rem;
    }

    .slip-preview-container {
      background: var(--bg-surface);
      padding: 1.5rem;
    }

    .slip-meta-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }

    .slip-media-box {
      text-align: center;
      padding: 2rem 1rem;
    }

    .slip-link {
      text-decoration: none;
      display: inline-block;
    }

    .slip-doc-placeholder {
      background: var(--bg-card);
      border: 2px dashed var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
      transition: var(--transition);
    }

    .slip-doc-placeholder:hover {
      border-color: #4f46e5;
      background: #eef2ff;
    }

    .slip-doc-placeholder span {
      font-size: 0.85rem;
      color: var(--text-muted);
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

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);
    }

    .empty-icon {
      margin-bottom: 1rem;
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
