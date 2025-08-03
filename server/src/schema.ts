
import { z } from 'zod';

// Customer schemas
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Room type and meal package enums
export const roomTypeEnum = z.enum(['double', 'triple', 'quad']);
export type RoomType = z.infer<typeof roomTypeEnum>;

export const mealPackageEnum = z.enum(['fullboard', 'halfboard']);
export type MealPackage = z.infer<typeof mealPackageEnum>;

// Hotel schemas
export const hotelSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  room_type: roomTypeEnum,
  meal_package: mealPackageEnum,
  base_price: z.number(), // Price in SAR
  markup_percentage: z.number(), // Markup percentage for selling price
  created_at: z.coerce.date()
});

export type Hotel = z.infer<typeof hotelSchema>;

export const createHotelInputSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  room_type: roomTypeEnum,
  meal_package: mealPackageEnum,
  base_price: z.number().positive(),
  markup_percentage: z.number().nonnegative()
});

export type CreateHotelInput = z.infer<typeof createHotelInputSchema>;

export const updateHotelInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  room_type: roomTypeEnum.optional(),
  meal_package: mealPackageEnum.optional(),
  base_price: z.number().positive().optional(),
  markup_percentage: z.number().nonnegative().optional()
});

export type UpdateHotelInput = z.infer<typeof updateHotelInputSchema>;

// Booking schemas
export const bookingSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  hotel_id: z.number(),
  check_in_date: z.coerce.date(),
  check_out_date: z.coerce.date(),
  room_count: z.number().int().positive(),
  total_price: z.number(), // Total selling price in SAR
  invoice_number: z.string(),
  created_at: z.coerce.date()
});

export type Booking = z.infer<typeof bookingSchema>;

export const createBookingInputSchema = z.object({
  customer_id: z.number(),
  hotel_id: z.number(),
  check_in_date: z.coerce.date(),
  check_out_date: z.coerce.date(),
  room_count: z.number().int().positive()
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;

// Payment method enum
export const paymentMethodEnum = z.enum(['cash', 'card', 'bank_transfer', 'online']);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

// Payment schemas
export const paymentSchema = z.object({
  id: z.number(),
  booking_id: z.number(),
  invoice_number: z.string(),
  amount: z.number().positive(), // Payment amount in SAR
  payment_method: paymentMethodEnum,
  payment_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z.object({
  booking_id: z.number(),
  amount: z.number().positive(),
  payment_method: paymentMethodEnum
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Report schemas
export const profitLossReportSchema = z.object({
  invoice_number: z.string(),
  customer_name: z.string(),
  hotel_name: z.string(),
  base_cost: z.number(),
  selling_price: z.number(),
  profit: z.number(),
  booking_date: z.coerce.date()
});

export type ProfitLossReport = z.infer<typeof profitLossReportSchema>;

export const monthlyBookingReportSchema = z.object({
  month: z.string(),
  year: z.number(),
  booking_count: z.number(),
  total_revenue: z.number(),
  total_profit: z.number()
});

export type MonthlyBookingReport = z.infer<typeof monthlyBookingReportSchema>;

export const outstandingInvoiceSchema = z.object({
  invoice_number: z.string(),
  customer_name: z.string(),
  hotel_name: z.string(),
  total_amount: z.number(),
  paid_amount: z.number(),
  outstanding_amount: z.number(),
  booking_date: z.coerce.date()
});

export type OutstandingInvoice = z.infer<typeof outstandingInvoiceSchema>;

// Booking summary schema for order confirmation
export const bookingSummarySchema = z.object({
  customer: customerSchema,
  hotel: hotelSchema,
  check_in_date: z.coerce.date(),
  check_out_date: z.coerce.date(),
  room_count: z.number(),
  nights: z.number(),
  base_price_per_night: z.number(),
  selling_price_per_night: z.number(),
  total_base_cost: z.number(),
  total_selling_price: z.number()
});

export type BookingSummary = z.infer<typeof bookingSummarySchema>;

// Invoice detail schema
export const invoiceDetailSchema = z.object({
  booking: bookingSchema,
  customer: customerSchema,
  hotel: hotelSchema,
  payments: z.array(paymentSchema),
  total_paid: z.number(),
  outstanding_balance: z.number()
});

export type InvoiceDetail = z.infer<typeof invoiceDetailSchema>;

// Delete input schemas
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;

// Report filter schemas
export const monthlyReportFilterSchema = z.object({
  year: z.number().optional(),
  month: z.number().min(1).max(12).optional()
});

export type MonthlyReportFilter = z.infer<typeof monthlyReportFilterSchema>;
