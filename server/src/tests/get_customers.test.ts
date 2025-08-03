
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer data
const testCustomer1: CreateCustomerInput = {
  name: 'John Doe',
  address: '123 Main St, Riyadh',
  phone: '+966501234567',
  email: 'john.doe@example.com'
};

const testCustomer2: CreateCustomerInput = {
  name: 'Jane Smith',
  address: '456 Oak Ave, Jeddah',
  phone: '+966507654321',
  email: 'jane.smith@example.com'
};

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all customers', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values([testCustomer1, testCustomer2])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].address).toEqual('123 Main St, Riyadh');
    expect(result[0].phone).toEqual('+966501234567');
    expect(result[0].email).toEqual('john.doe@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].address).toEqual('456 Oak Ave, Jeddah');
    expect(result[1].phone).toEqual('+966507654321');
    expect(result[1].email).toEqual('jane.smith@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return customers in creation order', async () => {
    // Create customers one by one to ensure order
    await db.insert(customersTable)
      .values(testCustomer1)
      .execute();

    await db.insert(customersTable)
      .values(testCustomer2)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should return valid customer objects', async () => {
    await db.insert(customersTable)
      .values(testCustomer1)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];
    
    // Validate all required fields are present
    expect(typeof customer.id).toBe('number');
    expect(typeof customer.name).toBe('string');
    expect(typeof customer.address).toBe('string');
    expect(typeof customer.phone).toBe('string');
    expect(typeof customer.email).toBe('string');
    expect(customer.created_at).toBeInstanceOf(Date);
  });
});
