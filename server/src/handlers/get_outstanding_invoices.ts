
import { db } from '../db';
import { bookingsTable, customersTable, hotelsTable, paymentsTable } from '../db/schema';
import { type OutstandingInvoice } from '../schema';
import { eq, sql, gt } from 'drizzle-orm';

export async function getOutstandingInvoices(): Promise<OutstandingInvoice[]> {
  try {
    // Query to get all bookings with their customer and hotel info, plus calculated payment totals
    const results = await db
      .select({
        invoice_number: bookingsTable.invoice_number,
        customer_name: customersTable.name,
        hotel_name: hotelsTable.name,
        total_amount: bookingsTable.total_price,
        booking_date: bookingsTable.created_at,
        paid_amount: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`.as('paid_amount')
      })
      .from(bookingsTable)
      .innerJoin(customersTable, eq(bookingsTable.customer_id, customersTable.id))
      .innerJoin(hotelsTable, eq(bookingsTable.hotel_id, hotelsTable.id))
      .leftJoin(paymentsTable, eq(bookingsTable.id, paymentsTable.booking_id))
      .groupBy(
        bookingsTable.id,
        bookingsTable.invoice_number,
        customersTable.name,
        hotelsTable.name,
        bookingsTable.total_price,
        bookingsTable.created_at
      )
      .having(
        gt(
          sql`${bookingsTable.total_price} - COALESCE(SUM(${paymentsTable.amount}), 0)`,
          sql`0`
        )
      )
      .execute();

    // Convert numeric fields and calculate outstanding amounts
    return results.map(result => {
      const totalAmount = parseFloat(result.total_amount);
      const paidAmount = parseFloat(result.paid_amount);
      const outstandingAmount = totalAmount - paidAmount;

      return {
        invoice_number: result.invoice_number,
        customer_name: result.customer_name,
        hotel_name: result.hotel_name,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        outstanding_amount: outstandingAmount,
        booking_date: result.booking_date
      };
    });
  } catch (error) {
    console.error('Failed to get outstanding invoices:', error);
    throw error;
  }
}
