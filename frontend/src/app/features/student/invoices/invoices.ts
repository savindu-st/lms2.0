import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../core/models/models';
import { PaymentService } from '../../../core/services/payment.service';
import { SystemService } from '../../../core/services/system.service';

@Component({
  selector: 'app-student-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container billing-page">
      <div class="page-header">
        <div>
          <span class="badge badge-emerald">Financial Records</span>
          <h1>Invoices & Payment Receipts</h1>
          <p class="text-secondary">Download official VAT/Tax compliant receipts for your professional development and tax deduction records.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading invoice records...</p>
        </div>
      } @else if (invoices().length === 0) {
        <div class="empty-state card">
          <h3>No payment records found</h3>
          <p class="text-secondary">When your bank transfer enrollment is verified, your official invoices will appear here.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Course / Masterclass</th>
                <th>Date Issued</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of invoices(); track inv.id) {
                <tr>
                  <td class="mono-num font-bold">{{ inv.invoiceNumber }}</td>
                  <td>{{ inv.courseTitle }}</td>
                  <td class="mono-num text-muted">{{ inv.issuedAt | date:'mediumDate' }}</td>
                  <td class="mono-num font-bold text-emerald">\${{ inv.total | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge badge-emerald">PAID</span>
                  </td>
                  <td>
                    <button (click)="viewInvoice(inv)" class="btn btn-outline btn-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      View Receipt
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Invoice Detail / Print Modal -->
      @if (activeInvoice()) {
        <div class="modal-overlay" (click)="onBackdropClick($event)">
          <div class="modal-content modal-content-lg invoice-modal">
            <button class="modal-close" (click)="activeInvoice.set(null)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <!-- Printable Invoice Sheet -->
            <div class="invoice-sheet" id="printable-invoice">
              <div class="invoice-top">
                <div class="inst-brand">
                  <h2>{{ systemService.academyName() }}</h2>
                  <span>Professional School of Accountancy</span>
                  <p class="inst-sub">Official Academic Receipt &bull; Instructor: {{ systemService.instructorName() }}</p>
                </div>
                <div class="inv-meta">
                  <div class="inv-title-tag">TAX INVOICE</div>
                  <div class="inv-meta-row">
                    <span class="label">Invoice No:</span>
                    <span class="val mono-num">{{ activeInvoice()?.invoiceNumber }}</span>
                  </div>
                  <div class="inv-meta-row">
                    <span class="label">Date:</span>
                    <span class="val mono-num">{{ activeInvoice()?.issuedAt | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>

              <div class="bill-to-section">
                <span class="bill-label">BILLED TO:</span>
                <h4>{{ activeInvoice()?.studentName }}</h4>
                <p class="mono-num">{{ activeInvoice()?.studentEmail }}</p>
              </div>

              <!-- Line items table -->
              <table class="inv-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{{ activeInvoice()?.courseTitle }}</strong>
                      <div class="text-muted" style="font-size: 0.8rem;">Full curriculum access with video lectures, workbook templates & instructor evaluation</div>
                    </td>
                    <td class="text-right mono-num">\${{ activeInvoice()?.subtotal | number:'1.2-2' }}</td>
                    <td class="text-right mono-num">1</td>
                    <td class="text-right mono-num">\${{ activeInvoice()?.subtotal | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="inv-totals-box">
                <div class="inv-total-row">
                  <span>Subtotal:</span>
                  <span class="mono-num">\${{ activeInvoice()?.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="inv-total-row">
                  <span>Tax (0.00%):</span>
                  <span class="mono-num">\${{ activeInvoice()?.taxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="inv-total-row grand-total">
                  <span>Total Paid:</span>
                  <span class="mono-num">\${{ activeInvoice()?.total | number:'1.2-2' }} USD</span>
                </div>
              </div>

              <div class="paid-stamp">
                <span>PAID IN FULL</span>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="printReceipt()" class="btn btn-emerald">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .billing-page {
      padding: 3rem 1.5rem 5rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-emerald {
      color: #059669;
    }

    .invoice-modal {
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

    .invoice-sheet {
      background: #ffffff;
      color: #0f172a;
      padding: 2.5rem;
      border-radius: var(--radius-md);
      position: relative;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .invoice-top {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .inst-brand h2 {
      color: #0f172a;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .inst-brand span {
      font-size: 0.85rem;
      font-weight: 600;
      color: #4f46e5;
      text-transform: uppercase;
    }

    .inst-sub {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .inv-meta {
      text-align: right;
    }

    .inv-title-tag {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }

    .inv-meta-row {
      font-size: 0.85rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .inv-meta-row .label {
      color: #64748b;
    }

    .inv-meta-row .val {
      font-weight: 700;
      color: #0f172a;
    }

    .bill-to-section {
      margin-bottom: 2rem;
    }

    .bill-label {
      font-size: 0.725rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
    }

    .bill-to-section h4 {
      font-size: 1.15rem;
      color: #0f172a;
      margin: 0.25rem 0;
    }

    .bill-to-section p {
      font-size: 0.85rem;
      color: #64748b;
    }

    .inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }

    .inv-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }

    .inv-table td {
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      font-size: 0.9rem;
    }

    .text-right {
      text-align: right;
    }

    .inv-totals-box {
      width: 280px;
      margin-left: auto;
      margin-bottom: 2rem;
    }

    .inv-total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0;
      font-size: 0.9rem;
      color: #475569;
    }

    .inv-total-row.grand-total {
      border-top: 2px solid #0f172a;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }

    .paid-stamp {
      position: absolute;
      bottom: 2.5rem;
      left: 2.5rem;
      border: 3px dashed #10b981;
      color: #10b981;
      font-size: 1.15rem;
      font-weight: 900;
      padding: 0.4rem 1.25rem;
      border-radius: 6px;
      transform: rotate(-10deg);
      letter-spacing: 0.08em;
      opacity: 0.85;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
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
export class StudentInvoicesComponent {
  paymentService = inject(PaymentService);
  systemService = inject(SystemService);

  invoices = signal<Invoice[]>([]);
  activeInvoice = signal<Invoice | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.paymentService.getMyInvoices().subscribe({
      next: (data) => {
        this.invoices.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  viewInvoice(inv: Invoice) {
    this.activeInvoice.set(inv);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.activeInvoice.set(null);
    }
  }

  printReceipt() {
    window.print();
  }
}
