
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookingsTable, customersTable, hotelsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { createBooking } from '../handlers/create_booking';
import { eq } from 'drizzle-orm';

describe('createBooking', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test customer
  const createTestCustomer = async () => {
    const result = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'john@example.com'
      })
      .returning()
      .execute();
    return result[0];
  };

  // Helper function to create test hotel
  const createTestHotel = async () => {
    const result = await db.insert(hotelsTable)
      .values({
        name: 'Test Hotel',
        location: 'Riyadh',
        room_type: 'double',
        meal_package: 'fullboard',
        base_price: '200.00',
        markup_percentage: '20.00'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a booking with calculated total price', async () => {
    const customer = await createTestCustomer();
    const hotel = await createTestHotel();

    const testInput: CreateBookingInput = {
      customer_id: customer.id,
      hotel_id: hotel.id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-03'), // 2 nights
      room_count: 2
    };

    const result = await createBooking(testInput);

    // Basic field validation
    expect(result.customer_id).toEqual(customer.id);
    expect(result.hotel_id).toEqual(hotel.id);
    expect(result.check_in_date).toEqual(new Date('2024-01-01'));
    expect(result.check_out_date).toEqual(new Date('2024-01-03'));
    expect(result.room_count).toEqual(2);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.invoice_number).toMatch(/^INV-/);

    // Price calculation validation
    // Base price: 200, markup: 20% -> selling price per night: 240
    // 2 nights * 2 rooms * 240 = 960
    expect(result.total_price).toEqual(960);
    expect(typeof result.total_price).toBe('number');
  });

  it('should save booking to database', async () => {
    const customer = await createTestCustomer();
    const hotel = await createTestHotel();

    const testInput: CreateBookingInput = {
      customer_id: customer.id,
      hotel_id: hotel.id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-02'), // 1 night
      room_count: 1
    };

    const result = await createBooking(testInput);

    // Query using proper drizzle syntax
    const bookings = await db.select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, result.id))
      .execute();

    expect(bookings).toHaveLength(1);
    expect(bookings[0].customer_id).toEqual(customer.id);
    expect(bookings[0].hotel_id).toEqual(hotel.id);
    expect(bookings[0].room_count).toEqual(1);
    expect(parseFloat(bookings[0].total_price)).toEqual(240); // 200 * 1.2 * 1 night * 1 room
    expect(bookings[0].invoice_number).toMatch(/^INV-/);
    expect(bookings[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique invoice numbers', async () => {
    const customer = await createTestCustomer();
    const hotel = await createTestHotel();

    const testInput: CreateBookingInput = {
      customer_id: customer.id,
      hotel_id: hotel.id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-02'),
      room_count: 1
    };

    const result1 = await createBooking(testInput);
    const result2 = await createBooking(testInput);

    expect(result1.invoice_number).not.toEqual(result2.invoice_number);
    expect(result1.invoice_number).toMatch(/^INV-/);
    expect(result2.invoice_number).toMatch(/^INV-/);
  });

  it('should calculate price correctly for multiple nights and rooms', async () => {
    const customer = await createTestCustomer();
    const hotel = await createTestHotel();

    const testInput: CreateBookingInput = {
      customer_id: customer.id,
      hotel_id: hotel.id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-05'), // 4 nights
      room_count: 3
    };

    const result = await createBooking(testInput);

    // Base price: 200, markup: 20% -> selling price per night: 240
    // 4 nights * 3 rooms * 240 = 2880
    expect(result.total_price).toEqual(2880);
  });

  it('should throw error for non-existent customer', async () => {
    const hotel = await createTestHotel();

    const testInput: CreateBookingInput = {
      customer_id: 99999, // Non-existent customer
      hotel_id: hotel.id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-02'),
      room_count: 1
    };

    expect(() => createBooking(testInput)).toThrow(/Customer with id 99999 not found/);
  });

  it('should throw error for non-existent hotel', async () => {
    const customer = await createTestCustomer();

    const testInput: CreateBookingInput = {
      customer_id: customer.id,
      hotel_id: 99999, // Non-existent hotel
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-02'),
      room_count: 1
    };

    expect(() => createBooking(testInput)).toThrow(/Hotel with id 99999 not found/);
  });

  it('should throw error for invalid date range', async () => {
    const customer = await createTestCustomer();
    const hotel = await createTestHotel();

    const testInput: CreateBookingInput = {
      customer_id: customer.id,
      hotel_id: hotel.id,
      check_in_date: new Date('2024-01-03'),
      check_out_date: new Date('2024-01-01'), // Check-out before check-in
      room_count: 1
    };

    expect(() => createBooking(testInput)).toThrow(/Check-out date must be after check-in date/);
  });
});
