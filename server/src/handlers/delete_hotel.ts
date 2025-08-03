
import { db } from '../db';
import { hotelsTable, bookingsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteHotel(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, check if there are any bookings referencing this hotel
    const existingBookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.hotel_id, input.id))
      .limit(1)
      .execute();

    if (existingBookings.length > 0) {
      throw new Error('Cannot delete hotel: there are existing bookings for this hotel');
    }

    // Check if hotel exists before attempting deletion
    const existingHotel = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingHotel.length === 0) {
      throw new Error('Hotel not found');
    }

    // Delete the hotel
    const result = await db.delete(hotelsTable)
      .where(eq(hotelsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Hotel deletion failed:', error);
    throw error;
  }
}
