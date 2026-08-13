import { InvoiceService } from './invoice.service';

describe('InvoiceService', () => {
  it('builds a print-ready invoice document matching the preview layout', () => {
    const service = new InvoiceService({} as any);

    const html = (service as any).buildInvoiceHtmlDocument({
      invoiceNumber: 'INV-2025-0001',
      invoiceDate: new Date('2025-01-15T00:00:00.000Z'),
      notes: 'Payment due in 7 days',
      totalAmount: 25000,
      discount: 1500,
      tax: 2200,
      grandTotal: 25700,
      booking: {
        bookingNumber: 'BK-001',
        clientName: 'Aanya Shah',
        mobile: '9876543210',
        eventName: 'Wedding Celebration',
        eventDate: new Date('2025-02-14T00:00:00.000Z'),
        photographerName: 'Sam',
        balanceAmount: 8000,
        advanceAmount: 17000,
        status: 'PENDING',
        editingProject: { overallStatus: 'IN_PROGRESS', editorName: 'Riya', assignedDate: new Date('2025-02-10T00:00:00.000Z') },
      },
      clientAddress: 'MG Road, Vadodara',
      servicesJson: JSON.stringify([{ itemNo: 1, description: 'TRADITIONAL PHOTO', days: '02' }]),
      albumDetailsJson: JSON.stringify([{ itemNo: 1, description: '12X36 ALBUM', qnt: '300PC', finish: 'MAT' }]),
      paymentTermsJson: JSON.stringify({ advance: 17000, weddingDay: 6000, handoverDay: 2000 }),
    }, {
      studioName: 'KANHA PHOTO & FILMS',
      address: 'Shop No. 233, Vadodara',
      email: 'studio@example.com',
      mobile: '8758241725',
      gstNumber: '27ABCDE1234F1Z5',
      invoiceFooter: 'Thank you for choosing us',
      invoiceTerms: 'All deliverables are subject to payment clearance.',
    }, {
      eventLocation: 'Vadodara',
      meetingTime: '18:30',
      meetingDate: new Date('2025-01-10T00:00:00.000Z'),
      notes: 'Initial consultation complete',
      email: 'client@example.com',
      photographerName: 'Sam',
    });

    expect(html).toContain('INVOICE');
    expect(html).toContain('KANHA PHOTO & FILMS');
    expect(html).toContain('Amount Summary');
    expect(html).toContain('@page');
  });
});
