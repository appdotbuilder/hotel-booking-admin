
import { db } from '../db';
import { paymentsTable, bookingsTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // First verify that the booking exists
    const booking = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, input.booking_id))
      .execute();

    if (booking.length === 0) {
      throw new Error(`Booking with id ${input.booking_id} not found`);
    }

    // Get the invoice number from the booking
    const invoiceNumber = booking[0].invoice_number;

    // Insert payment record
    const result = await db.insert(paymentsTable)
      .values({
        booking_id: input.booking_id,
        invoice_number: invoiceNumber,
        amount: input.amount.toString(), // Convert number to string for numeric column
        payment_method: input.payment_method,
        payment_date: new Date()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};
