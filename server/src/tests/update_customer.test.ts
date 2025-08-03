
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type CreateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test inputs
const createInput: CreateCustomerInput = {
  name: 'John Doe',
  address: '123 Main St',
  phone: '+966501234567',
  email: 'john@example.com'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update customer name only', async () => {
    // Create initial customer
    const [customer] = await db.insert(customersTable)
      .values(createInput)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      name: 'Jane Doe'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customer.id);
    expect(result.name).toEqual('Jane Doe');
    expect(result.address).toEqual('123 Main St'); // Unchanged
    expect(result.phone).toEqual('+966501234567'); // Unchanged
    expect(result.email).toEqual('john@example.com'); // Unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create initial customer
    const [customer] = await db.insert(customersTable)
      .values(createInput)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+966509876543'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customer.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.address).toEqual('123 Main St'); // Unchanged
    expect(result.phone).toEqual('+966509876543');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated customer to database', async () => {
    // Create initial customer
    const [customer] = await db.insert(customersTable)
      .values(createInput)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      name: 'Updated Name',
      address: '456 New Street'
    };

    await updateCustomer(updateInput);

    // Verify changes in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('Updated Name');
    expect(customers[0].address).toEqual('456 New Street');
    expect(customers[0].phone).toEqual('+966501234567'); // Unchanged
    expect(customers[0].email).toEqual('john@example.com'); // Unchanged
  });

  it('should throw error for non-existent customer', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 999,
      name: 'Non-existent Customer'
    };

    await expect(updateCustomer(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update all fields when provided', async () => {
    // Create initial customer
    const [customer] = await db.insert(customersTable)
      .values(createInput)
      .returning()
      .execute();

    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      name: 'Completely New Name',
      address: '789 Different Ave',
      phone: '+966555123456',
      email: 'new.email@example.com'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customer.id);
    expect(result.name).toEqual('Completely New Name');
    expect(result.address).toEqual('789 Different Ave');
    expect(result.phone).toEqual('+966555123456');
    expect(result.email).toEqual('new.email@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
