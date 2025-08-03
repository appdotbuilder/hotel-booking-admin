
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, hotelsTable, bookingsTable, paymentsTable } from '../db/schema';
import { getInvoiceDetail } from '../handlers/get_invoice_detail';

describe('getInvoiceDetail', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent invoice', async () => {
    const result = await getInvoiceDetail('NON_EXISTENT');
    expect(result).toBeNull();
  });

  it('should return invoice detail with no payments', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        address: '123 Main St',
        phone: '+966501234567',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Grand Hotel',
        location: 'Riyadh',
        room_type: 'double',
        meal_package: 'fullboard',
        base_price: '200.00',
        markup_percentage: '20.00'
      })
      .returning()
      .execute();

    // Create booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        customer_id: customerResult[0].id,
        hotel_id: hotelResult[0].id,
        check_in_date: new Date('2024-01-15'),
        check_out_date: new Date('2024-01-20'),
        room_count: 2,
        total_price: '2400.00',
        invoice_number: 'INV-001'
      })
      .returning()
      .execute();

    const result = await getInvoiceDetail('INV-001');

    expect(result).not.toBeNull();
    expect(result!.booking.id).toEqual(bookingResult[0].id);
    expect(result!.booking.invoice_number).toEqual('INV-001');
    expect(result!.booking.total_price).toEqual(2400);
    expect(typeof result!.booking.total_price).toBe('number');

    expect(result!.customer.name).toEqual('John Doe');
    expect(result!.customer.email).toEqual('john@example.com');

    expect(result!.hotel.name).toEqual('Grand Hotel');
    expect(result!.hotel.base_price).toEqual(200);
    expect(result!.hotel.markup_percentage).toEqual(20);
    expect(typeof result!.hotel.base_price).toBe('number');
    expect(typeof result!.hotel.markup_percentage).toBe('number');

    expect(result!.payments).toHaveLength(0);
    expect(result!.total_paid).toEqual(0);
    expect(result!.outstanding_balance).toEqual(2400);
  });

  it('should return invoice detail with payments and calculate balances', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        address: '456 Oak Ave',
        phone: '+966509876543',
        email: 'jane@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Luxury Resort',
        location: 'Jeddah',
        room_type: 'triple',
        meal_package: 'halfboard',
        base_price: '300.50',
        markup_percentage: '15.75'
      })
      .returning()
      .execute();

    // Create booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        customer_id: customerResult[0].id,
        hotel_id: hotelResult[0].id,
        check_in_date: new Date('2024-02-01'),
        check_out_date: new Date('2024-02-05'),
        room_count: 1,
        total_price: '1500.00',
        invoice_number: 'INV-002'
      })
      .returning()
      .execute();

    // Create payments
    await db.insert(paymentsTable)
      .values([
        {
          booking_id: bookingResult[0].id,
          invoice_number: 'INV-002',
          amount: '500.00',
          payment_method: 'cash',
          payment_date: new Date('2024-02-01')
        },
        {
          booking_id: bookingResult[0].id,
          invoice_number: 'INV-002',
          amount: '750.50',
          payment_method: 'card',
          payment_date: new Date('2024-02-02')
        }
      ])
      .execute();

    const result = await getInvoiceDetail('INV-002');

    expect(result).not.toBeNull();
    expect(result!.booking.invoice_number).toEqual('INV-002');
    expect(result!.booking.total_price).toEqual(1500);

    expect(result!.customer.name).toEqual('Jane Smith');
    expect(result!.hotel.name).toEqual('Luxury Resort');
    expect(result!.hotel.base_price).toEqual(300.5);
    expect(result!.hotel.markup_percentage).toEqual(15.75);

    expect(result!.payments).toHaveLength(2);
    expect(result!.payments[0].amount).toEqual(500);
    expect(result!.payments[1].amount).toEqual(750.5);
    expect(typeof result!.payments[0].amount).toBe('number');
    expect(typeof result!.payments[1].amount).toBe('number');

    expect(result!.total_paid).toEqual(1250.5);
    expect(result!.outstanding_balance).toEqual(249.5);
  });

  it('should handle fully paid invoice', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Bob Wilson',
        address: '789 Pine St',
        phone: '+966502468135',
        email: 'bob@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotelResult = await db.insert(hotelsTable)
      .values({
        name: 'Budget Inn',
        location: 'Dammam',
        room_type: 'quad',
        meal_package: 'fullboard',
        base_price: '150.00',
        markup_percentage: '10.00'
      })
      .returning()
      .execute();

    // Create booking
    const bookingResult = await db.insert(bookingsTable)
      .values({
        customer_id: customerResult[0].id,
        hotel_id: hotelResult[0].id,
        check_in_date: new Date('2024-03-01'),
        check_out_date: new Date('2024-03-03'),
        room_count: 1,
        total_price: '800.00',
        invoice_number: 'INV-003'
      })
      .returning()
      .execute();

    // Create payment that covers full amount
    await db.insert(paymentsTable)
      .values({
        booking_id: bookingResult[0].id,
        invoice_number: 'INV-003',
        amount: '800.00',
        payment_method: 'bank_transfer',
        payment_date: new Date('2024-03-01')
      })
      .execute();

    const result = await getInvoiceDetail('INV-003');

    expect(result).not.toBeNull();
    expect(result!.total_paid).toEqual(800);
    expect(result!.outstanding_balance).toEqual(0);
    expect(result!.payments).toHaveLength(1);
    expect(result!.payments[0].payment_method).toEqual('bank_transfer');
  });
});
