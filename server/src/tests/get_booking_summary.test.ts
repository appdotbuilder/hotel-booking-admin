
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, hotelsTable } from '../db/schema';
import { type CreateBookingInput } from '../schema';
import { getBookingSummary } from '../handlers/get_booking_summary';

describe('getBookingSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate booking summary correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        address: '123 Main St, Riyadh',
        phone: '+966501234567',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    // Create test hotel
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Grand Hotel',
        location: 'Riyadh Downtown',
        room_type: 'double',
        meal_package: 'fullboard',
        base_price: '200.00',
        markup_percentage: '20.00'
      })
      .returning()
      .execute();

    const testInput: CreateBookingInput = {
      customer_id: customerResult[0].id,
      hotel_id: hotelResult[0].id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-04'), // 3 nights
      room_count: 2
    };

    const result = await getBookingSummary(testInput);

    // Verify customer data
    expect(result.customer.id).toEqual(customerResult[0].id);
    expect(result.customer.name).toEqual('John Doe');
    expect(result.customer.email).toEqual('john@example.com');

    // Verify hotel data
    expect(result.hotel.id).toEqual(hotelResult[0].id);
    expect(result.hotel.name).toEqual('Grand Hotel');
    expect(result.hotel.base_price).toEqual(200);
    expect(result.hotel.markup_percentage).toEqual(20);

    // Verify booking details
    expect(result.check_in_date).toEqual(new Date('2024-01-01'));
    expect(result.check_out_date).toEqual(new Date('2024-01-04'));
    expect(result.room_count).toEqual(2);
    expect(result.nights).toEqual(3);

    // Verify price calculations
    expect(result.base_price_per_night).toEqual(200);
    expect(result.selling_price_per_night).toEqual(240); // 200 + 20% markup
    expect(result.total_base_cost).toEqual(1200); // 200 * 3 nights * 2 rooms
    expect(result.total_selling_price).toEqual(1440); // 240 * 3 nights * 2 rooms
  });

  it('should handle single night booking', async () => {
    // Create test data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        address: '456 Oak Ave, Jeddah',
        phone: '+966509876543',
        email: 'jane@example.com'
      })
      .returning()
      .execute();

    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Luxury Resort',
        location: 'Jeddah Corniche',
        room_type: 'triple',
        meal_package: 'halfboard',
        base_price: '350.50',
        markup_percentage: '15.75'
      })
      .returning()
      .execute();

    const testInput: CreateBookingInput = {
      customer_id: customerResult[0].id,
      hotel_id: hotelResult[0].id,
      check_in_date: new Date('2024-02-15'),
      check_out_date: new Date('2024-02-16'), // 1 night
      room_count: 1
    };

    const result = await getBookingSummary(testInput);

    expect(result.nights).toEqual(1);
    expect(result.base_price_per_night).toEqual(350.5);
    expect(result.selling_price_per_night).toEqual(405.70375); // 350.5 * 1.1575
    expect(result.total_base_cost).toEqual(350.5);
    expect(result.total_selling_price).toEqual(405.70375);
  });

  it('should throw error for non-existent customer', async () => {
    // Create only hotel data
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Test Hotel',
        location: 'Test Location',
        room_type: 'double',
        meal_package: 'fullboard',
        base_price: '100.00',
        markup_percentage: '10.00'
      })
      .returning()
      .execute();

    const testInput: CreateBookingInput = {
      customer_id: 99999, // Non-existent customer
      hotel_id: hotelResult[0].id,
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-02'),
      room_count: 1
    };

    await expect(getBookingSummary(testInput)).rejects.toThrow(/customer.*not found/i);
  });

  it('should throw error for non-existent hotel', async () => {
    // Create only customer data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        address: 'Test Address',
        phone: '+966500000000',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const testInput: CreateBookingInput = {
      customer_id: customerResult[0].id,
      hotel_id: 99999, // Non-existent hotel
      check_in_date: new Date('2024-01-01'),
      check_out_date: new Date('2024-01-02'),
      room_count: 1
    };

    await expect(getBookingSummary(testInput)).rejects.toThrow(/hotel.*not found/i);
  });

  it('should throw error for invalid date range', async () => {
    // Create test data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        address: 'Test Address',
        phone: '+966500000000',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Test Hotel',
        location: 'Test Location',
        room_type: 'double',
        meal_package: 'fullboard',
        base_price: '100.00',
        markup_percentage: '10.00'
      })
      .returning()
      .execute();

    const testInput: CreateBookingInput = {
      customer_id: customerResult[0].id,
      hotel_id: hotelResult[0].id,
      check_in_date: new Date('2024-01-05'),
      check_out_date: new Date('2024-01-03'), // Check-out before check-in
      room_count: 1
    };

    await expect(getBookingSummary(testInput)).rejects.toThrow(/check-out date must be after check-in date/i);
  });

  it('should handle zero markup percentage', async () => {
    // Create test data with zero markup
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Budget Customer',
        address: 'Economy Street',
        phone: '+966500111222',
        email: 'budget@example.com'
      })
      .returning()
      .execute();

    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Budget Inn',
        location: 'Downtown',
        room_type: 'quad',
        meal_package: 'halfboard',
        base_price: '150.00',
        markup_percentage: '0.00' // No markup
      })
      .returning()
      .execute();

    const testInput: CreateBookingInput = {
      customer_id: customerResult[0].id,
      hotel_id: hotelResult[0].id,
      check_in_date: new Date('2024-03-01'),
      check_out_date: new Date('2024-03-03'), // 2 nights
      room_count: 3
    };

    const result = await getBookingSummary(testInput);

    expect(result.hotel.markup_percentage).toEqual(0);
    expect(result.base_price_per_night).toEqual(150);
    expect(result.selling_price_per_night).toEqual(150); // Same as base price
    expect(result.total_base_cost).toEqual(900); // 150 * 2 nights * 3 rooms
    expect(result.total_selling_price).toEqual(900); // Same as base cost
  });
});
