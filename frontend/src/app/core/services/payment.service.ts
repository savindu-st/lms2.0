import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankDetails, Invoice, Payment } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api';

  submitBankTransfer(data: {
    courseId: string;
    transactionRef: string;
    slipFileUrl: string;
    originalSlipFileName?: string;
    transferDate?: string;
    studentNotes?: string;
  }): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/student/checkout/bank-transfer`, data);
  }

  getMyInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/student/invoices`);
  }

  getInvoice(invoiceId: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/student/invoices/${invoiceId}`);
  }

  getBankDetails(): Observable<BankDetails> {
    return this.http.get<BankDetails>(`${this.apiUrl}/student/bank-details`);
  }

  uploadFile(file: File, category: 'slips' | 'materials' | 'submissions' | 'general' = 'general'): Observable<{ fileUrl: string; originalName: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.http.post<{ fileUrl: string; originalName: string; size: number }>(`${this.apiUrl}/files/upload`, formData);
  }
}
