
import { db } from '../db';
import { hotelsTable } from '../db/schema';
import { type UpdateHotelInput, type Hotel } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHotel = async (input: UpdateHotelInput): Promise<Hotel> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.name !== undefined) updateData['name'] = input.name;
    if (input.location !== undefined) updateData['location'] = input.location;
    if (input.room_type !== undefined) updateData['room_type'] = input.room_type;
    if (input.meal_package !== undefined) updateData['meal_package'] = input.meal_package;
    if (input.base_price !== undefined) updateData['base_price'] = input.base_price.toString();
    if (input.markup_percentage !== undefined) updateData['markup_percentage'] = input.markup_percentage.toString();

    // Update hotel record
    const result = await db.update(hotelsTable)
      .set(updateData)
      .where(eq(hotelsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Hotel with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const hotel = result[0];
    return {
      ...hotel,
      base_price: parseFloat(hotel.base_price),
      markup_percentage: parseFloat(hotel.markup_percentage)
    };
  } catch (error) {
    console.error('Hotel update failed:', error);
    throw error;
  }
};
