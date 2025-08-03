
import { db } from '../db';
import { customersTable, hotelsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateBookingInput, type BookingSummary } from '../schema';

export async function getBookingSummary(input: CreateBookingInput): Promise<BookingSummary> {
  try {
    // Fetch customer data
    const customerResults = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customerResults.length === 0) {
      throw new Error(`Customer with ID ${input.customer_id} not found`);
    }

    // Fetch hotel data
    const hotelResults = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, input.hotel_id))
      .execute();

    if (hotelResults.length === 0) {
      throw new Error(`Hotel with ID ${input.hotel_id} not found`);
    }

    const customer = customerResults[0];
    const hotelData = hotelResults[0];

    // Calculate nights between check-in and check-out dates
    const checkIn = new Date(input.check_in_date);
    const checkOut = new Date(input.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date');
    }

    // Convert numeric fields from database
    const basePricePerNight = parseFloat(hotelData.base_price);
    const markupPercentage = parseFloat(hotelData.markup_percentage);

    // Calculate selling price with markup
    const sellingPricePerNight = basePricePerNight * (1 + markupPercentage / 100);

    // Calculate total costs
    const totalBaseCost = basePricePerNight * nights * input.room_count;
    const totalSellingPrice = sellingPricePerNight * nights * input.room_count;

    // Build hotel object with converted numeric fields
    const hotel = {
      ...hotelData,
      base_price: basePricePerNight,
      markup_percentage: markupPercentage
    };

    return {
      customer,
      hotel,
      check_in_date: checkIn,
      check_out_date: checkOut,
      room_count: input.room_count,
      nights,
      base_price_per_night: basePricePerNight,
      selling_price_per_night: sellingPricePerNight,
      total_base_cost: totalBaseCost,
      total_selling_price: totalSellingPrice
    };
  } catch (error) {
    console.error('Get booking summary failed:', error);
    throw error;
  }
}
