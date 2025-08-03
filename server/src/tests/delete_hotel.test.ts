
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hotelsTable, customersTable, bookingsTable } from '../db/schema';
import { type DeleteInput, type CreateHotelInput, type CreateCustomerInput, type CreateBookingInput } from '../schema';
import { deleteHotel } from '../handlers/delete_hotel';
import { eq } from 'drizzle-orm';

const testHotelInput: CreateHotelInput = {
  name: 'Test Hotel',
  location: 'Mecca',
  room_type: 'double',
  meal_package: 'fullboard',
  base_price: 500.00,
  markup_percentage: 20.00
};

const testCustomerInput: CreateCustomerInput = {
  name: 'Test Customer',
  address: 'Test Address',
  phone: '+966501234567',
  email: 'test@example.com'
};

describe('deleteHotel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing hotel with no bookings', async () => {
    // Create a hotel first
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: testHotelInput.name,
        location: testHotelInput.location,
        room_type: testHotelInput.room_type,
        meal_package: testHotelInput.meal_package,
        base_price: testHotelInput.base_price.toString(),
        markup_percentage: testHotelInput.markup_percentage.toString()
      })
      .returning()
      .execute();

    const hotel = hotelResult[0];
    const deleteInput: DeleteInput = { id: hotel.id };

    // Delete the hotel
    const result = await deleteHotel(deleteInput);

    expect(result.success).toBe(true);

    // Verify hotel is deleted from database
    const deletedHotel = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, hotel.id))
      .execute();

    expect(deletedHotel).toHaveLength(0);
  });

  it('should throw error when hotel does not exist', async () => {
    const deleteInput: DeleteInput = { id: 9999 };

    await expect(deleteHotel(deleteInput)).rejects.toThrow(/hotel not found/i);
  });

  it('should throw error when hotel has existing bookings', async () => {
    // Create customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: testCustomerInput.name,
        address: testCustomerInput.address,
        phone: testCustomerInput.phone,
        email: testCustomerInput.email
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    // Create hotel
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: testHotelInput.name,
        location: testHotelInput.location,
        room_type: testHotelInput.room_type,
        meal_package: testHotelInput.meal_package,
        base_price: testHotelInput.base_price.toString(),
        markup_percentage: testHotelInput.markup_percentage.toString()
      })
      .returning()
      .execute();

    const hotel = hotelResult[0];

    // Create a booking for this hotel
    const checkInDate = new Date('2024-01-01');
    const checkOutDate = new Date('2024-01-05');
    
    await db.insert(bookingsTable)
      .values({
        customer_id: customer.id,
        hotel_id: hotel.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        room_count: 2,
        total_price: '2400.00', // 4 nights * 2 rooms * 600 SAR (500 + 20% markup)
        invoice_number: 'INV-001'
      })
      .execute();

    const deleteInput: DeleteInput = { id: hotel.id };

    // Attempt to delete hotel with existing bookings
    await expect(deleteHotel(deleteInput)).rejects.toThrow(/cannot delete hotel.*existing bookings/i);

    // Verify hotel still exists in database
    const existingHotel = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, hotel.id))
      .execute();

    expect(existingHotel).toHaveLength(1);
  });

  it('should verify booking reference constraint', async () => {
    // Create customer and hotel
    const customerResult = await db.insert(customersTable)
      .values({
        name: testCustomerInput.name,
        address: testCustomerInput.address,
        phone: testCustomerInput.phone,
        email: testCustomerInput.email
      })
      .returning()
      .execute();

    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: testHotelInput.name,
        location: testHotelInput.location,
        room_type: testHotelInput.room_type,
        meal_package: testHotelInput.meal_package,
        base_price: testHotelInput.base_price.toString(),
        markup_percentage: testHotelInput.markup_percentage.toString()
      })
      .returning()
      .execute();

    const customer = customerResult[0];
    const hotel = hotelResult[0];

    // Create booking
    await db.insert(bookingsTable)
      .values({
        customer_id: customer.id,
        hotel_id: hotel.id,
        check_in_date: new Date('2024-01-01'),
        check_out_date: new Date('2024-01-05'),
        room_count: 1,
        total_price: '1200.00',
        invoice_number: 'INV-002'
      })
      .execute();

    // Verify the booking exists and references the hotel
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.hotel_id, hotel.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].hotel_id).toBe(hotel.id);

    // Verify deletion fails due to existing booking
    const deleteInput: DeleteInput = { id: hotel.id };
    await expect(deleteHotel(deleteInput)).rejects.toThrow(/cannot delete hotel.*existing bookings/i);
  });
});
