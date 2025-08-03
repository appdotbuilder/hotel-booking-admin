
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hotelsTable } from '../db/schema';
import { type CreateHotelInput, type UpdateHotelInput, type Hotel } from '../schema';
import { updateHotel } from '../handlers/update_hotel';
import { eq } from 'drizzle-orm';

// Helper to create a test hotel
const createTestHotel = async (): Promise<Hotel> => {
  const testHotelInput: CreateHotelInput = {
    name: 'Original Hotel',
    location: 'Original Location',
    room_type: 'double',
    meal_package: 'fullboard',
    base_price: 100.00,
    markup_percentage: 20.00
  };

  const result = await db.insert(hotelsTable)
    .values({
      name: testHotelInput.name,
      location: testHotelInput.location,
      room_type: testHotelInput.room_type,
      meal_package: testHotelInput.meal_package,
      base_price: testHotelInput.base_price.toString(),
      markup_percentage: testHotelInput.markup_percentage.toString()
    })
    .returning()
    .execute();

  const hotel = result[0];
  return {
    ...hotel,
    base_price: parseFloat(hotel.base_price),
    markup_percentage: parseFloat(hotel.markup_percentage)
  };
};

describe('updateHotel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update hotel with all fields', async () => {
    const hotel = await createTestHotel();

    const updateInput: UpdateHotelInput = {
      id: hotel.id,
      name: 'Updated Hotel',
      location: 'Updated Location',
      room_type: 'triple',
      meal_package: 'halfboard',
      base_price: 150.50,
      markup_percentage: 25.75
    };

    const result = await updateHotel(updateInput);

    expect(result.id).toEqual(hotel.id);
    expect(result.name).toEqual('Updated Hotel');
    expect(result.location).toEqual('Updated Location');
    expect(result.room_type).toEqual('triple');
    expect(result.meal_package).toEqual('halfboard');
    expect(result.base_price).toEqual(150.50);
    expect(result.markup_percentage).toEqual(25.75);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update hotel with partial fields', async () => {
    const hotel = await createTestHotel();

    const updateInput: UpdateHotelInput = {
      id: hotel.id,
      name: 'Partially Updated Hotel',
      base_price: 200.00
    };

    const result = await updateHotel(updateInput);

    expect(result.id).toEqual(hotel.id);
    expect(result.name).toEqual('Partially Updated Hotel');
    expect(result.location).toEqual('Original Location'); // Unchanged
    expect(result.room_type).toEqual('double'); // Unchanged
    expect(result.meal_package).toEqual('fullboard'); // Unchanged
    expect(result.base_price).toEqual(200.00); // Updated
    expect(result.markup_percentage).toEqual(20.00); // Unchanged
  });

  it('should save updates to database', async () => {
    const hotel = await createTestHotel();

    const updateInput: UpdateHotelInput = {
      id: hotel.id,
      name: 'Database Updated Hotel',
      markup_percentage: 30.00
    };

    await updateHotel(updateInput);

    const hotels = await db.select()
      .from(hotelsTable)
      .where(eq(hotelsTable.id, hotel.id))
      .execute();

    expect(hotels).toHaveLength(1);
    expect(hotels[0].name).toEqual('Database Updated Hotel');
    expect(parseFloat(hotels[0].markup_percentage)).toEqual(30.00);
    expect(hotels[0].location).toEqual('Original Location'); // Unchanged
  });

  it('should throw error for non-existent hotel', async () => {
    const updateInput: UpdateHotelInput = {
      id: 999,
      name: 'Non-existent Hotel'
    };

    expect(updateHotel(updateInput)).rejects.toThrow(/hotel with id 999 not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    const hotel = await createTestHotel();

    const updateInput: UpdateHotelInput = {
      id: hotel.id,
      base_price: 99.99,
      markup_percentage: 15.25
    };

    const result = await updateHotel(updateInput);

    expect(typeof result.base_price).toBe('number');
    expect(typeof result.markup_percentage).toBe('number');
    expect(result.base_price).toEqual(99.99);
    expect(result.markup_percentage).toEqual(15.25);
  });

  it('should update only room type', async () => {
    const hotel = await createTestHotel();

    const updateInput: UpdateHotelInput = {
      id: hotel.id,
      room_type: 'quad'
    };

    const result = await updateHotel(updateInput);

    expect(result.room_type).toEqual('quad');
    expect(result.name).toEqual('Original Hotel'); // Unchanged
    expect(result.meal_package).toEqual('fullboard'); // Unchanged
  });

  it('should update only meal package', async () => {
    const hotel = await createTestHotel();

    const updateInput: UpdateHotelInput = {
      id: hotel.id,
      meal_package: 'halfboard'
    };

    const result = await updateHotel(updateInput);

    expect(result.meal_package).toEqual('halfboard');
    expect(result.name).toEqual('Original Hotel'); // Unchanged
    expect(result.room_type).toEqual('double'); // Unchanged
  });
});
