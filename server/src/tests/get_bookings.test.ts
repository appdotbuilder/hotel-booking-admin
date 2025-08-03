
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, hotelsTable, bookingsTable } from '../db/schema';
import { type CreateCustomerInput, type CreateHotelInput, type CreateBookingInput } from '../schema';
import { getBookings } from '../handlers/get_bookings';

// Test data
const testCustomer: CreateCustomerInput = {
  name: 'John Doe',
  address: '123 Main St',
  phone: '+1234567890',
  email: 'john@example.com'
};

const testHotel: CreateHotelInput = {
  name: 'Test Hotel',
  location: 'Mecca',
  room_type: 'double',
  meal_package: 'fullboard',
  base_price: 200.00,
  markup_percentage: 10.00
};

const testBookingData = {
  check_in_date: new Date('2024-01-15'),
  check_out_date: new Date('2024-01-20'),
  room_count: 2,
  total_price: 1100.00,
  invoice_number: 'INV-001'
};

describe('getBookings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no bookings exist', async () => {
    const result = await getBookings();
    expect(result).toEqual([]);
  });

  it('should return all bookings', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    const hotelResult = await db.insert(hotelsTable)
      .values({
        ...testHotel,
        base_price: testHotel.base_price.toString(),
        markup_percentage: testHotel.markup_percentage.toString()
      })
      .returning()
      .execute();
    const hotel = hotelResult[0];

    // Create booking
    await db.insert(bookingsTable)
      .values({
        customer_id: customer.id,
        hotel_id: hotel.id,
        check_in_date: testBookingData.check_in_date,
        check_out_date: testBookingData.check_out_date,
        room_count: testBookingData.room_count,
        total_price: testBookingData.total_price.toString(),
        invoice_number: testBookingData.invoice_number
      })
      .execute();

    const result = await getBookings();

    expect(result).toHaveLength(1);
    const booking = result[0];
    
    expect(booking.customer_id).toEqual(customer.id);
    expect(booking.hotel_id).toEqual(hotel.id);
    expect(booking.check_in_date).toEqual(testBookingData.check_in_date);
    expect(booking.check_out_date).toEqual(testBookingData.check_out_date);
    expect(booking.room_count).toEqual(testBookingData.room_count);
    expect(booking.total_price).toEqual(1100.00);
    expect(typeof booking.total_price).toEqual('number');
    expect(booking.invoice_number).toEqual('INV-001');
    expect(booking.id).toBeDefined();
    expect(booking.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple bookings in order', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    const hotelResult = await db.insert(hotelsTable)
      .values({
        ...testHotel,
        base_price: testHotel.base_price.toString(),
        markup_percentage: testHotel.markup_percentage.toString()
      })
      .returning()
      .execute();
    const hotel = hotelResult[0];

    // Create multiple bookings
    await db.insert(bookingsTable)
      .values([
        {
          customer_id: customer.id,
          hotel_id: hotel.id,
          check_in_date: new Date('2024-01-15'),
          check_out_date: new Date('2024-01-20'),
          room_count: 1,
          total_price: '500.00',
          invoice_number: 'INV-001'
        },
        {
          customer_id: customer.id,
          hotel_id: hotel.id,
          check_in_date: new Date('2024-02-15'),
          check_out_date: new Date('2024-02-20'),
          room_count: 2,
          total_price: '1000.00',
          invoice_number: 'INV-002'
        }
      ])
      .execute();

    const result = await getBookings();

    expect(result).toHaveLength(2);
    
    // Verify all bookings have correct numeric conversion
    result.forEach(booking => {
      expect(typeof booking.total_price).toEqual('number');
      expect(booking.id).toBeDefined();
      expect(booking.created_at).toBeInstanceOf(Date);
    });

    // Check specific booking data
    const booking1 = result.find(b => b.invoice_number === 'INV-001');
    const booking2 = result.find(b => b.invoice_number === 'INV-002');
    
    expect(booking1?.total_price).toEqual(500.00);
    expect(booking1?.room_count).toEqual(1);
    expect(booking2?.total_price).toEqual(1000.00);
    expect(booking2?.room_count).toEqual(2);
  });
});
