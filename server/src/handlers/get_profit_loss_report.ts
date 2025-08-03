
import { db } from '../db';
import { bookingsTable, customersTable, hotelsTable } from '../db/schema';
import { type ProfitLossReport } from '../schema';
import { eq } from 'drizzle-orm';

export async function getProfitLossReport(): Promise<ProfitLossReport[]> {
  try {
    // Join bookings with customers and hotels to get all necessary data
    const results = await db.select()
      .from(bookingsTable)
      .innerJoin(customersTable, eq(bookingsTable.customer_id, customersTable.id))
      .innerJoin(hotelsTable, eq(bookingsTable.hotel_id, hotelsTable.id))
      .execute();

    // Process results to calculate profit/loss for each booking
    return results.map(result => {
      const booking = result.bookings;
      const customer = result.customers;
      const hotel = result.hotels;

      // Calculate number of nights
      const checkInDate = new Date(booking.check_in_date);
      const checkOutDate = new Date(booking.check_out_date);
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate base cost (hotel base price * nights * room count)
      const basePricePerNight = parseFloat(hotel.base_price);
      const baseCost = basePricePerNight * nights * booking.room_count;

      // Get selling price from booking
      const sellingPrice = parseFloat(booking.total_price);

      // Calculate profit
      const profit = sellingPrice - baseCost;

      return {
        invoice_number: booking.invoice_number,
        customer_name: customer.name,
        hotel_name: hotel.name,
        base_cost: baseCost,
        selling_price: sellingPrice,
        profit: profit,
        booking_date: booking.created_at
      };
    });
  } catch (error) {
    console.error('Profit/loss report generation failed:', error);
    throw error;
  }
}
