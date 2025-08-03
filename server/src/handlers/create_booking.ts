
import { db } from '../db';
import { bookingsTable, customersTable, hotelsTable } from '../db/schema';
import { type CreateBookingInput, type Booking } from '../schema';
import { eq } from 'drizzle-orm';

export const createBooking = async (input: CreateBookingInput): Promise<Booking> => {
  try {
    // Verify customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} not found`);
    }

    // Verify hotel exists and get pricing info
    const hotel = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, input.hotel_id))
      .execute();

    if (hotel.length === 0) {
      throw new Error(`Hotel with id ${input.hotel_id} not found`);
    }

    // Calculate total price
    const hotelData = hotel[0];
    const basePrice = parseFloat(hotelData.base_price);
    const markupPercentage = parseFloat(hotelData.markup_percentage);
    
    // Calculate nights
    const checkInDate = new Date(input.check_in_date);
    const checkOutDate = new Date(input.check_out_date);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date');
    }

    // Calculate selling price per night
    const sellingPricePerNight = basePrice * (1 + markupPercentage / 100);
    const totalPrice = sellingPricePerNight * nights * input.room_count;

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert booking record
    const result = await db.insert(bookingsTable)
      .values({
        customer_id: input.customer_id,
        hotel_id: input.hotel_id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        room_count: input.room_count,
        total_price: totalPrice.toString(), // Convert number to string for numeric column
        invoice_number: invoiceNumber
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const booking = result[0];
    return {
      ...booking,
      total_price: parseFloat(booking.total_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};
