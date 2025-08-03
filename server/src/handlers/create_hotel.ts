
import { db } from '../db';
import { hotelsTable } from '../db/schema';
import { type CreateHotelInput, type Hotel } from '../schema';

export const createHotel = async (input: CreateHotelInput): Promise<Hotel> => {
  try {
    // Insert hotel record
    const result = await db.insert(hotelsTable)
      .values({
        name: input.name,
        location: input.location,
        room_type: input.room_type,
        meal_package: input.meal_package,
        base_price: input.base_price.toString(), // Convert number to string for numeric column
        markup_percentage: input.markup_percentage.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const hotel = result[0];
    return {
      ...hotel,
      base_price: parseFloat(hotel.base_price), // Convert string back to number
      markup_percentage: parseFloat(hotel.markup_percentage) // Convert string back to number
    };
  } catch (error) {
    console.error('Hotel creation failed:', error);
    throw error;
  }
};
