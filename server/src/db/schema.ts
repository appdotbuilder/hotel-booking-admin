
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roomTypeEnum = pgEnum('room_type', ['double', 'triple', 'quad']);
export const mealPackageEnum = pgEnum('meal_package', ['fullboard', 'halfboard']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'bank_transfer', 'online']);

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Hotels table
export const hotelsTable = pgTable('hotels', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  room_type: roomTypeEnum('room_type').notNull(),
  meal_package: mealPackageEnum('meal_package').notNull(),
  base_price: numeric('base_price', { precision: 10, scale: 2 }).notNull(), // Base price in SAR
  markup_percentage: numeric('markup_percentage', { precision: 5, scale: 2 }).notNull(), // Markup percentage
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Bookings table
export const bookingsTable = pgTable('bookings', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').references(() => customersTable.id).notNull(),
  hotel_id: integer('hotel_id').references(() => hotelsTable.id).notNull(),
  check_in_date: timestamp('check_in_date').notNull(),
  check_out_date: timestamp('check_out_date').notNull(),
  room_count: integer('room_count').notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(), // Total selling price in SAR
  invoice_number: text('invoice_number').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  booking_id: integer('booking_id').references(() => bookingsTable.id).notNull(),
  invoice_number: text('invoice_number').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Payment amount in SAR
  payment_method: paymentMethodEnum('payment_method').notNull(),
  payment_date: timestamp('payment_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const hotelsRelations = relations(hotelsTable, ({ many }) => ({
  bookings: many(bookingsTable),
}));

export const bookingsRelations = relations(bookingsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [bookingsTable.customer_id],
    references: [customersTable.id],
  }),
  hotel: one(hotelsTable, {
    fields: [bookingsTable.hotel_id],
    references: [hotelsTable.id],
  }),
  payments: many(paymentsTable),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  booking: one(bookingsTable, {
    fields: [paymentsTable.booking_id],
    references: [bookingsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  customers: customersTable,
  hotels: hotelsTable,
  bookings: bookingsTable,
  payments: paymentsTable,
};

// TypeScript types for table schemas
export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;

export type Hotel = typeof hotelsTable.$inferSelect;
export type NewHotel = typeof hotelsTable.$inferInsert;

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;

export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;
