
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  address: '123 Main Street, Riyadh, Saudi Arabia',
  phone: '+966501234567',
  email: 'john.doe@example.com'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.address).toEqual(testInput.address);
    expect(result.phone).toEqual(testInput.phone);
    expect(result.email).toEqual(testInput.email);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query database to verify customer was saved
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].address).toEqual(testInput.address);
    expect(customers[0].phone).toEqual(testInput.phone);
    expect(customers[0].email).toEqual(testInput.email);
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different customer data', async () => {
    const arabicInput: CreateCustomerInput = {
      name: 'أحمد محمد',
      address: 'شارع الملك فهد، الرياض، المملكة العربية السعودية',
      phone: '+966509876543',
      email: 'ahmed.mohammed@example.sa'
    };

    const result = await createCustomer(arabicInput);

    expect(result.name).toEqual('أحمد محمد');
    expect(result.address).toEqual(arabicInput.address);
    expect(result.phone).toEqual(arabicInput.phone);
    expect(result.email).toEqual(arabicInput.email);
    expect(result.id).toBeDefined();
  });

  it('should create multiple customers with unique IDs', async () => {
    const customer1 = await createCustomer(testInput);
    
    const secondInput: CreateCustomerInput = {
      name: 'Jane Smith',
      address: '456 Oak Avenue, Jeddah, Saudi Arabia',
      phone: '+966507654321',
      email: 'jane.smith@example.com'
    };
    
    const customer2 = await createCustomer(secondInput);

    expect(customer1.id).not.toEqual(customer2.id);
    expect(customer1.name).toEqual('John Doe');
    expect(customer2.name).toEqual('Jane Smith');
    
    // Verify both are in database
    const allCustomers = await db.select()
      .from(customersTable)
      .execute();
    
    expect(allCustomers).toHaveLength(2);
  });
});
