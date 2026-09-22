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
          <h1>Invoices & Payment Receipts</h1>
          <p class="text-secondary">Download and inspect official tax-compliant receipts for your records and accounting development expenses.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading invoice records...</p>
        </div>
      } @else if (invoices().length === 0) {
        <div class="empty-state card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          <h3>No payment records found</h3>
          <p class="text-secondary">When your bank wire enrollment is verified by the instructor, your official tax invoices will appear here.</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Course / Masterclass</th>
                <th>Date Issued</th>
                <th>Tuition Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of invoices(); track inv.id) {
                <tr>
                  <td class="mono-num font-bold">{{ inv.invoiceNumber }}</td>
                  <td>
                    <span class="font-medium">{{ inv.courseTitle }}</span>
                  </td>
                  <td class="mono-num text-muted" style="font-size: 0.8125rem;">{{ inv.issuedAt | date:'mediumDate' }}</td>
                  <td class="mono-num font-bold text-primary">\${{ inv.total | number:'1.2-2' }}</td>
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
            <button class="modal-close" (click)="activeInvoice.set(null)" title="Close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <!-- Printable Invoice Sheet -->
            <div class="invoice-sheet" id="printable-invoice">
              <div class="invoice-top">
                <div class="inst-brand">
                  <h2>{{ systemService.academyName() }}</h2>
                  <span class="academy-tag">Professional School of Accountancy</span>
                  <p class="inst-sub">Official Academic Receipt &bull; Instructor: {{ systemService.instructorName() }}</p>
                </div>
                <div class="inv-meta">
                  <div class="inv-title-tag">TAX INVOICE</div>
                  <div class="inv-meta-row">
                    <span class="label">Invoice No:</span>
                    <span class="val mono-num">{{ activeInvoice()?.invoiceNumber }}</span>
                  </div>
                  <div class="inv-meta-row">
                    <span class="label">Issued Date:</span>
                    <span class="val mono-num">{{ activeInvoice()?.issuedAt | date:'mediumDate' }}</span>
                  </div>
                </div>
              </div>

              <div class="bill-to-section">
                <span class="bill-label">BILLED TO</span>
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
                      <div class="text-muted" style="font-size: 0.75rem;">Full cohort access, modular video lectures, workbook templates, and instructor evaluations</div>
                    </td>
                    <td class="text-right mono-num">\${{ activeInvoice()?.subtotal | number:'1.2-2' }}</td>
                    <td class="text-right mono-num">1</td>
                    <td class="text-right mono-num font-bold">\${{ activeInvoice()?.subtotal | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>

              <div class="inv-totals-box">
                <div class="inv-total-row">
                  <span>Subtotal</span>
                  <span class="mono-num">\${{ activeInvoice()?.subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="inv-total-row">
                  <span>Tax (0.00%)</span>
                  <span class="mono-num">\${{ activeInvoice()?.taxAmount | number:'1.2-2' }}</span>
                </div>
                <div class="inv-total-row grand-total">
                  <span>Total Paid</span>
                  <span class="mono-num">\${{ activeInvoice()?.total | number:'1.2-2' }} USD</span>
                </div>
              </div>

              <div class="paid-stamp">
                <span>PAID IN FULL</span>
              </div>
            </div>

            <div class="modal-footer">
              <button (click)="printReceipt()" class="btn btn-primary btn-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Receipt / PDF
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .billing-page {
      padding: 2.5rem 1.5rem 5rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .invoice-modal {
      position: relative;
    }

    .invoice-sheet {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 2.25rem;
      position: relative;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .invoice-top {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .inst-brand h2 {
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .academy-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .inst-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .inv-meta {
      text-align: right;
    }

    .inv-title-tag {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.35rem;
      letter-spacing: 0.05em;
    }

    .inv-meta-row {
      font-size: 0.8125rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .inv-meta-row .label {
      color: var(--text-muted);
    }

    .inv-meta-row .val {
      font-weight: 600;
      color: var(--text-primary);
    }

    .bill-to-section {
      margin-bottom: 1.75rem;
    }

    .bill-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .bill-to-section h4 {
      font-size: 1.05rem;
      margin: 0.2rem 0;
    }

    .bill-to-section p {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.75rem;
    }

    .inv-table th {
      background: var(--bg-subtle);
      padding: 0.65rem 0.85rem;
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
    }

    .inv-table td {
      padding: 0.85rem;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.8125rem;
    }

    .text-right {
      text-align: right;
    }

    .inv-totals-box {
      width: 260px;
      margin-left: auto;
      margin-bottom: 1.5rem;
    }

    .inv-total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 0;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .inv-total-row.grand-total {
      border-top: 1px solid var(--text-primary);
      margin-top: 0.4rem;
      padding-top: 0.6rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .paid-stamp {
      position: absolute;
      bottom: 2rem;
      left: 2.25rem;
      border: 2px solid var(--emerald);
      color: var(--emerald);
      font-size: 0.9375rem;
      font-weight: 800;
      padding: 0.3rem 0.85rem;
      border-radius: var(--radius-sm);
      transform: rotate(-8deg);
      letter-spacing: 0.08em;
      opacity: 0.9;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
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
