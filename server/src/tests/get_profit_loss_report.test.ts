
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, hotelsTable, bookingsTable } from '../db/schema';
import { type CreateCustomerInput, type CreateHotelInput, type CreateBookingInput } from '../schema';
import { getProfitLossReport } from '../handlers/get_profit_loss_report';

// Test data
const testCustomer: CreateCustomerInput = {
  name: 'John Doe',
  address: '123 Main St',
  phone: '+1234567890',
  email: 'john@example.com'
};

const testHotel: CreateHotelInput = {
  name: 'Grand Hotel',
  location: 'Mecca',
  room_type: 'double',
  meal_package: 'fullboard',
  base_price: 200.00,
  markup_percentage: 25.00
};

describe('getProfitLossReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no bookings exist', async () => {
    const result = await getProfitLossReport();
    expect(result).toEqual([]);
  });

  it('should generate profit/loss report for single booking', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create hotel
    const hotelResult = await db.insert(hotelsTable)
      .values({
        ...testHotel,
        base_price: testHotel.base_price.toString(),
        markup_percentage: testHotel.markup_percentage.toString()
      })
      .returning()
      .execute();
    const hotel = hotelResult[0];

    // Create booking (3 nights, 2 rooms)
    const checkInDate = new Date('2024-01-15');
    const checkOutDate = new Date('2024-01-18'); // 3 nights
    const roomCount = 2;
    const totalPrice = 1500.00; // Selling price

    await db.insert(bookingsTable)
      .values({
        customer_id: customer.id,
        hotel_id: hotel.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        room_count: roomCount,
        total_price: totalPrice.toString(),
        invoice_number: 'INV-001'
      })
      .execute();

    const result = await getProfitLossReport();

    expect(result).toHaveLength(1);
    
    const report = result[0];
    expect(report.invoice_number).toEqual('INV-001');
    expect(report.customer_name).toEqual('John Doe');
    expect(report.hotel_name).toEqual('Grand Hotel');
    
    // Calculate expected values: 200 * 3 nights * 2 rooms = 1200 base cost
    expect(report.base_cost).toEqual(1200.00);
    expect(report.selling_price).toEqual(1500.00);
    expect(report.profit).toEqual(300.00); // 1500 - 1200
    expect(report.booking_date).toBeInstanceOf(Date);
  });

  it('should generate report for multiple bookings with different profit margins', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create two hotels with different base prices
    const hotel1Result = await db.insert(hotelsTable)
      .values({
        ...testHotel,
        name: 'Budget Hotel',
        base_price: '100.00',
        markup_percentage: '50.00'
      })
      .returning()
      .execute();
    const hotel1 = hotel1Result[0];

    const hotel2Result = await db.insert(hotelsTable)
      .values({
        ...testHotel,
        name: 'Luxury Hotel',
        base_price: '400.00',
        markup_percentage: '20.00'
      })
      .returning()
      .execute();
    const hotel2 = hotel2Result[0];

    // Create two bookings
    await db.insert(bookingsTable)
      .values([
        {
          customer_id: customer.id,
          hotel_id: hotel1.id,
          check_in_date: new Date('2024-01-10'),
          check_out_date: new Date('2024-01-12'), // 2 nights
          room_count: 1,
          total_price: '250.00', // 100*2*1 = 200 base, profit = 50
          invoice_number: 'INV-001'
        },
        {
          customer_id: customer.id,
          hotel_id: hotel2.id,
          check_in_date: new Date('2024-02-01'),
          check_out_date: new Date('2024-02-04'), // 3 nights
          room_count: 2,
          total_price: '2000.00', // 400*3*2 = 2400 base, profit = -400 (loss)
          invoice_number: 'INV-002'
        }
      ])
      .execute();

    const result = await getProfitLossReport();

    expect(result).toHaveLength(2);

    // Find reports by invoice number
    const report1 = result.find(r => r.invoice_number === 'INV-001');
    const report2 = result.find(r => r.invoice_number === 'INV-002');

    expect(report1).toBeDefined();
    expect(report1!.base_cost).toEqual(200.00);
    expect(report1!.selling_price).toEqual(250.00);
    expect(report1!.profit).toEqual(50.00);
    expect(report1!.hotel_name).toEqual('Budget Hotel');

    expect(report2).toBeDefined();
    expect(report2!.base_cost).toEqual(2400.00);
    expect(report2!.selling_price).toEqual(2000.00);
    expect(report2!.profit).toEqual(-400.00); // Loss
    expect(report2!.hotel_name).toEqual('Luxury Hotel');
  });

  it('should handle single night bookings correctly', async () => {
    // Create customer and hotel
    const customerResult = await db.insert(customersTable)
      .values(testCustomer)
      .returning()
      .execute();
    const customer = customerResult[0];

    const hotelResult = await db.insert(hotelsTable)
      .values({
        ...testHotel,
        base_price: '150.00',
        markup_percentage: '30.00'
      })
      .returning()
      .execute();
    const hotel = hotelResult[0];

    // Single night booking
    await db.insert(bookingsTable)
      .values({
        customer_id: customer.id,
        hotel_id: hotel.id,
        check_in_date: new Date('2024-03-01'),
        check_out_date: new Date('2024-03-02'), // 1 night
        room_count: 1,
        total_price: '200.00',
        invoice_number: 'INV-SINGLE'
      })
      .execute();

    const result = await getProfitLossReport();

    expect(result).toHaveLength(1);
    expect(result[0].base_cost).toEqual(150.00); // 150 * 1 night * 1 room
    expect(result[0].selling_price).toEqual(200.00);
    expect(result[0].profit).toEqual(50.00);
  });
});
