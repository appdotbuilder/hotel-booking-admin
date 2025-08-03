
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, hotelsTable, bookingsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteCustomer } from '../handlers/delete_customer';
import { eq } from 'drizzle-orm';

describe('deleteCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a customer successfully', async () => {
    // Create a test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        address: '123 Test Street',
        phone: '+966501234567',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const input: DeleteInput = { id: customerId };
    const result = await deleteCustomer(input);

    expect(result.success).toBe(true);

    // Verify customer is deleted from database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(customers).toHaveLength(0);
  });

  it('should throw error when customer not found', async () => {
    const input: DeleteInput = { id: 99999 };

    await expect(deleteCustomer(input)).rejects.toThrow(/customer not found/i);
  });

  it('should prevent deletion of customer with existing bookings', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Customer with Bookings',
        address: '123 Test Street',
        phone: '+966501234567',
        email: 'customer@example.com'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create test hotel
    const hotelResult = await db.insert(hotelsTable)
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

    const hotelId = hotelResult[0].id;

    // Create booking for the customer
    await db.insert(bookingsTable)
      .values({
        customer_id: customerId,
        hotel_id: hotelId,
        check_in_date: new Date('2024-01-15'),
        check_out_date: new Date('2024-01-18'),
        room_count: 1,
        total_price: '720.00',
        invoice_number: 'INV-001'
      })
      .execute();

    const input: DeleteInput = { id: customerId };

    await expect(deleteCustomer(input)).rejects.toThrow(/cannot delete customer with existing bookings/i);

    // Verify customer still exists
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(customers).toHaveLength(1);
  });
});
