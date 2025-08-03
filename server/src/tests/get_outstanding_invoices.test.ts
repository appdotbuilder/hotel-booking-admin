
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, hotelsTable, bookingsTable, paymentsTable } from '../db/schema';
import { getOutstandingInvoices } from '../handlers/get_outstanding_invoices';

describe('getOutstandingInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no outstanding invoices exist', async () => {
    const result = await getOutstandingInvoices();
    expect(result).toEqual([]);
  });

  it('should return invoices with outstanding balances', async () => {
    // Create customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        address: '123 Main St',
        phone: '555-0123',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotel = await db.insert(hotelsTable)
      .values({
        name: 'Test Hotel',
        location: 'Mecca',
        room_type: 'double',
        meal_package: 'fullboard',
        base_price: '500.00',
        markup_percentage: '20.00'
      })
      .returning()
      .execute();

    // Create booking with total price 1000.00
    const booking = await db.insert(bookingsTable)
      .values({
        customer_id: customer[0].id,
        hotel_id: hotel[0].id,
        check_in_date: new Date('2024-01-15'),
        check_out_date: new Date('2024-01-20'),
        room_count: 2,
        total_price: '1000.00',
        invoice_number: 'INV-001'
      })
      .returning()
      .execute();

    // Create partial payment of 600.00 (outstanding: 400.00)
    await db.insert(paymentsTable)
      .values({
        booking_id: booking[0].id,
        invoice_number: 'INV-001',
        amount: '600.00',
        payment_method: 'cash'
      })
      .execute();

    const result = await getOutstandingInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].customer_name).toEqual('John Doe');
    expect(result[0].hotel_name).toEqual('Test Hotel');
    expect(result[0].total_amount).toEqual(1000);
    expect(result[0].paid_amount).toEqual(600);
    expect(result[0].outstanding_amount).toEqual(400);
    expect(result[0].booking_date).toBeInstanceOf(Date);
  });

  it('should not return fully paid invoices', async () => {
    // Create customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        address: '456 Oak Ave',
        phone: '555-0456',
        email: 'jane@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotel = await db.insert(hotelsTable)
      .values({
        name: 'Paid Hotel',
        location: 'Medina',
        room_type: 'triple',
        meal_package: 'halfboard',
        base_price: '400.00',
        markup_percentage: '15.00'
      })
      .returning()
      .execute();

    // Create booking
    const booking = await db.insert(bookingsTable)
      .values({
        customer_id: customer[0].id,
        hotel_id: hotel[0].id,
        check_in_date: new Date('2024-02-10'),
        check_out_date: new Date('2024-02-15'),
        room_count: 1,
        total_price: '800.00',
        invoice_number: 'INV-002'
      })
      .returning()
      .execute();

    // Create full payment
    await db.insert(paymentsTable)
      .values({
        booking_id: booking[0].id,
        invoice_number: 'INV-002',
        amount: '800.00',
        payment_method: 'card'
      })
      .execute();

    const result = await getOutstandingInvoices();
    expect(result).toHaveLength(0);
  });

  it('should handle multiple payments correctly', async () => {
    // Create customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'Bob Wilson',
        address: '789 Pine St',
        phone: '555-0789',
        email: 'bob@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotel = await db.insert(hotelsTable)
      .values({
        name: 'Multi Payment Hotel',
        location: 'Riyadh',
        room_type: 'quad',
        meal_package: 'fullboard',
        base_price: '600.00',
        markup_percentage: '25.00'
      })
      .returning()
      .execute();

    // Create booking
    const booking = await db.insert(bookingsTable)
      .values({
        customer_id: customer[0].id,
        hotel_id: hotel[0].id,
        check_in_date: new Date('2024-03-01'),
        check_out_date: new Date('2024-03-07'),
        room_count: 3,
        total_price: '1500.00',
        invoice_number: 'INV-003'
      })
      .returning()
      .execute();

    // Create multiple payments totaling 1200.00 (outstanding: 300.00)
    await db.insert(paymentsTable)
      .values([
        {
          booking_id: booking[0].id,
          invoice_number: 'INV-003',
          amount: '500.00',
          payment_method: 'cash'
        },
        {
          booking_id: booking[0].id,
          invoice_number: 'INV-003',
          amount: '400.00',
          payment_method: 'bank_transfer'
        },
        {
          booking_id: booking[0].id,
          invoice_number: 'INV-003',
          amount: '300.00',
          payment_method: 'card'
        }
      ])
      .execute();

    const result = await getOutstandingInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-003');
    expect(result[0].total_amount).toEqual(1500);
    expect(result[0].paid_amount).toEqual(1200);
    expect(result[0].outstanding_amount).toEqual(300);
  });

  it('should handle bookings with no payments', async () => {
    // Create customer
    const customer = await db.insert(customersTable)
      .values({
        name: 'Alice Brown',
        address: '321 Elm St',
        phone: '555-0321',
        email: 'alice@example.com'
      })
      .returning()
      .execute();

    // Create hotel
    const hotel = await db.insert(hotelsTable)
      .values({
        name: 'No Payment Hotel',
        location: 'Jeddah',
        room_type: 'double',
        meal_package: 'halfboard',
        base_price: '350.00',
        markup_percentage: '30.00'
      })
      .returning()
      .execute();

    // Create booking with no payments
    await db.insert(bookingsTable)
      .values({
        customer_id: customer[0].id,
        hotel_id: hotel[0].id,
        check_in_date: new Date('2024-04-05'),
        check_out_date: new Date('2024-04-10'),
        room_count: 1,
        total_price: '750.00',
        invoice_number: 'INV-004'
      })
      .execute();

    const result = await getOutstandingInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-004');
    expect(result[0].customer_name).toEqual('Alice Brown');
    expect(result[0].hotel_name).toEqual('No Payment Hotel');
    expect(result[0].total_amount).toEqual(750);
    expect(result[0].paid_amount).toEqual(0);
    expect(result[0].outstanding_amount).toEqual(750);
  });
});
