
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hotelsTable } from '../db/schema';
import { type CreateHotelInput } from '../schema';
import { createHotel } from '../handlers/create_hotel';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateHotelInput = {
  name: 'Test Hotel',
  location: 'Makkah',
  room_type: 'double',
  meal_package: 'fullboard',
  base_price: 250.00,
  markup_percentage: 15.5
};

describe('createHotel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a hotel', async () => {
    const result = await createHotel(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Hotel');
    expect(result.location).toEqual('Makkah');
    expect(result.room_type).toEqual('double');
    expect(result.meal_package).toEqual('fullboard');
    expect(result.base_price).toEqual(250.00);
    expect(result.markup_percentage).toEqual(15.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types are properly converted
    expect(typeof result.base_price).toBe('number');
    expect(typeof result.markup_percentage).toBe('number');
  });

  it('should save hotel to database', async () => {
    const result = await createHotel(testInput);

    // Query using proper drizzle syntax
    const hotels = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, result.id))
      .execute();

    expect(hotels).toHaveLength(1);
    expect(hotels[0].name).toEqual('Test Hotel');
    expect(hotels[0].location).toEqual('Makkah');
    expect(hotels[0].room_type).toEqual('double');
    expect(hotels[0].meal_package).toEqual('fullboard');
    expect(parseFloat(hotels[0].base_price)).toEqual(250.00);
    expect(parseFloat(hotels[0].markup_percentage)).toEqual(15.5);
    expect(hotels[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different room types and meal packages', async () => {
    const tripleRoomInput: CreateHotelInput = {
      name: 'Triple Room Hotel',
      location: 'Madinah',
      room_type: 'triple',
      meal_package: 'halfboard',
      base_price: 180.75,
      markup_percentage: 20.0
    };

    const result = await createHotel(tripleRoomInput);

    expect(result.room_type).toEqual('triple');
    expect(result.meal_package).toEqual('halfboard');
    expect(result.base_price).toEqual(180.75);
    expect(result.markup_percentage).toEqual(20.0);
  });

  it('should handle zero markup percentage', async () => {
    const zeroMarkupInput: CreateHotelInput = {
      name: 'No Markup Hotel',
      location: 'Jeddah',
      room_type: 'quad',
      meal_package: 'fullboard',
      base_price: 300.00,
      markup_percentage: 0.0
    };

    const result = await createHotel(zeroMarkupInput);

    expect(result.markup_percentage).toEqual(0.0);
    expect(typeof result.markup_percentage).toBe('number');
  });
});
