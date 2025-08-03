
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hotelsTable } from '../db/schema';
import { type CreateHotelInput } from '../schema';
import { getHotels } from '../handlers/get_hotels';

// Test hotel data
const testHotel1: CreateHotelInput = {
  name: 'Grand Hotel',
  location: 'Mecca',
  room_type: 'double',
  meal_package: 'fullboard',
  base_price: 250.50,
  markup_percentage: 15.0
};

const testHotel2: CreateHotelInput = {
  name: 'Paradise Resort',
  location: 'Medina',
  room_type: 'triple',
  meal_package: 'halfboard',
  base_price: 180.75,
  markup_percentage: 20.5
};

describe('getHotels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no hotels exist', async () => {
    const result = await getHotels();
    
    expect(result).toEqual([]);
  });

  it('should return all hotels', async () => {
    // Insert test hotels
    await db.insert(hotelsTable)
      .values([
        {
          name: testHotel1.name,
          location: testHotel1.location,
          room_type: testHotel1.room_type,
          meal_package: testHotel1.meal_package,
          base_price: testHotel1.base_price.toString(),
          markup_percentage: testHotel1.markup_percentage.toString()
        },
        {
          name: testHotel2.name,
          location: testHotel2.location,
          room_type: testHotel2.room_type,
          meal_package: testHotel2.meal_package,
          base_price: testHotel2.base_price.toString(),
          markup_percentage: testHotel2.markup_percentage.toString()
        }
      ])
      .execute();

    const result = await getHotels();

    expect(result).toHaveLength(2);
    
    // Find hotels by name for consistent testing
    const grandHotel = result.find(h => h.name === 'Grand Hotel');
    const paradiseResort = result.find(h => h.name === 'Paradise Resort');

    // Verify first hotel
    expect(grandHotel).toBeDefined();
    expect(grandHotel!.name).toEqual('Grand Hotel');
    expect(grandHotel!.location).toEqual('Mecca');
    expect(grandHotel!.room_type).toEqual('double');
    expect(grandHotel!.meal_package).toEqual('fullboard');
    expect(grandHotel!.base_price).toEqual(250.50);
    expect(grandHotel!.markup_percentage).toEqual(15.0);
    expect(grandHotel!.id).toBeDefined();
    expect(grandHotel!.created_at).toBeInstanceOf(Date);

    // Verify second hotel
    expect(paradiseResort).toBeDefined();
    expect(paradiseResort!.name).toEqual('Paradise Resort');
    expect(paradiseResort!.location).toEqual('Medina');
    expect(paradiseResort!.room_type).toEqual('triple');
    expect(paradiseResort!.meal_package).toEqual('halfboard');
    expect(paradiseResort!.base_price).toEqual(180.75);
    expect(paradiseResort!.markup_percentage).toEqual(20.5);
    expect(paradiseResort!.id).toBeDefined();
    expect(paradiseResort!.created_at).toBeInstanceOf(Date);
  });

  it('should return hotels with correct numeric types', async () => {
    // Insert test hotel
    await db.insert(hotelsTable)
      .values({
        name: testHotel1.name,
        location: testHotel1.location,
        room_type: testHotel1.room_type,
        meal_package: testHotel1.meal_package,
        base_price: testHotel1.base_price.toString(),
        markup_percentage: testHotel1.markup_percentage.toString()
      })
      .execute();

    const result = await getHotels();

    expect(result).toHaveLength(1);
    
    const hotel = result[0];
    expect(typeof hotel.base_price).toBe('number');
    expect(typeof hotel.markup_percentage).toBe('number');
    expect(hotel.base_price).toEqual(250.50);
    expect(hotel.markup_percentage).toEqual(15.0);
  });
});
