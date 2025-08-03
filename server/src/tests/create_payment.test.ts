
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentsTable, customersTable, hotelsTable, bookingsTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

// Test data setup
const testCustomer = {
  name: 'John Doe',
  address: '123 Main St',
  phone: '+1234567890',
  email: 'john@example.com'
};

const testHotel = {
  name: 'Test Hotel',
  location: 'Test City',
  room_type: 'double' as const,
  meal_package: 'fullboard' as const,
  base_price: '100.00',
  markup_percentage: '20.00'
};

const testBooking = {
  customer_id: 1,
  hotel_id: 1,
  check_in_date: new Date('2024-01-01'),
  check_out_date: new Date('2024-01-05'),
  room_count: 2,
  total_price: '480.00',
  invoice_number: 'INV-2024-001'
};

const testInput: CreatePaymentInput = {
  booking_id: 1,
  amount: 200.00,
  payment_method: 'cash'
};

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a payment', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(hotelsTable).values(testHotel).execute();
    await db.insert(bookingsTable).values(testBooking).execute();

    const result = await createPayment(testInput);

    // Basic field validation
    expect(result.booking_id).toEqual(1);
    expect(result.invoice_number).toEqual('INV-2024-001');
    expect(result.amount).toEqual(200.00);
    expect(typeof result.amount).toBe('number');
    expect(result.payment_method).toEqual('cash');
    expect(result.id).toBeDefined();
    expect(result.payment_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(hotelsTable).values(testHotel).execute();
    await db.insert(bookingsTable).values(testBooking).execute();

    const result = await createPayment(testInput);

    // Query using proper drizzle syntax
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].booking_id).toEqual(1);
    expect(payments[0].invoice_number).toEqual('INV-2024-001');
    expect(parseFloat(payments[0].amount)).toEqual(200.00);
    expect(payments[0].payment_method).toEqual('cash');
    expect(payments[0].payment_date).toBeInstanceOf(Date);
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should use invoice number from booking', async () => {
    // Create prerequisite data
    await db.insert(customersTable).values(testCustomer).execute();
    await db.insert(hotelsTable).values(testHotel).execute();
    await db.insert(bookingsTable).values(testBooking).execute();

    const result = await createPayment(testInput);

    expect(result.invoice_number).toEqual('INV-2024-001');
  });

  it('should throw error when booking does not exist', async () => {
    const invalidInput: CreatePaymentInput = {
      booking_id: 999,
      amount: 100.00,
      payment_method: 'cash'
    };

    await expect(createPayment(invalidInput)).rejects.toThrow(/booking with id 999 not found/i);
  });
});
