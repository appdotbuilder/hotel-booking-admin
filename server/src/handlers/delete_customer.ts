
import { db } from '../db';
import { customersTable, bookingsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCustomer(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Check if customer has existing bookings
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customer_id, input.id))
      .execute();

    if (existingBookings.length > 0) {
      throw new Error('Cannot delete customer with existing bookings');
    }

    // Delete the customer
    const result = await db.delete(customersTable)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Customer not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
}
