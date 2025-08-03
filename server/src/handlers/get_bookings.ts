
import { db } from '../db';
import { bookingsTable } from '../db/schema';
import { type Booking } from '../schema';

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const results = await db.select()
      .from(bookingsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(booking => ({
      ...booking,
      total_price: parseFloat(booking.total_price)
    }));
  } catch (error) {
    console.error('Get bookings failed:', error);
    throw error;
  }
};
