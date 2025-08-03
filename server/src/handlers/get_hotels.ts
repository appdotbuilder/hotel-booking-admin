
import { db } from '../db';
import { hotelsTable } from '../db/schema';
import { type Hotel } from '../schema';

export const getHotels = async (): Promise<Hotel[]> => {
  try {
    const results = await db.select()
      .from(hotelsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(hotel => ({
      ...hotel,
      base_price: parseFloat(hotel.base_price),
      markup_percentage: parseFloat(hotel.markup_percentage)
    }));
  } catch (error) {
    console.error('Get hotels failed:', error);
    throw error;
  }
};
