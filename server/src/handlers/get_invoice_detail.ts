
import { db } from '../db';
import { bookingsTable, customersTable, hotelsTable, paymentsTable } from '../db/schema';
import { type InvoiceDetail } from '../schema';
import { eq } from 'drizzle-orm';

export async function getInvoiceDetail(invoiceNumber: string): Promise<InvoiceDetail | null> {
  try {
    // Get booking with customer and hotel data using joins
    const bookingResult = await db.select()
      .from(bookingsTable)
      .innerJoin(customersTable, eq(bookingsTable.customer_id, customersTable.id))
      .innerJoin(hotelsTable, eq(bookingsTable.hotel_id, hotelsTable.id))
      .where(eq(bookingsTable.invoice_number, invoiceNumber))
      .execute();

    if (bookingResult.length === 0) {
      return null;
    }

    const result = bookingResult[0];

    // Get all payments for this booking
    const paymentsResult = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.booking_id, result.bookings.id))
      .execute();

    // Convert numeric fields and prepare data
    const booking = {
      ...result.bookings,
      total_price: parseFloat(result.bookings.total_price)
    };

    const customer = result.customers;

    const hotel = {
      ...result.hotels,
      base_price: parseFloat(result.hotels.base_price),
      markup_percentage: parseFloat(result.hotels.markup_percentage)
    };

    const payments = paymentsResult.map(payment => ({
      ...payment,
      amount: parseFloat(payment.amount)
    }));

    // Calculate total paid amount
    const total_paid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate outstanding balance
    const outstanding_balance = booking.total_price - total_paid;

    return {
      booking,
      customer,
      hotel,
      payments,
      total_paid,
      outstanding_balance
    };
  } catch (error) {
    console.error('Get invoice detail failed:', error);
    throw error;
  }
}
