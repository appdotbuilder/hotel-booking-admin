
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
  deleteInputSchema,
  createHotelInputSchema,
  updateHotelInputSchema,
  createBookingInputSchema,
  createPaymentInputSchema,
  monthlyReportFilterSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { updateCustomer } from './handlers/update_customer';
import { deleteCustomer } from './handlers/delete_customer';
import { createHotel } from './handlers/create_hotel';
import { getHotels } from './handlers/get_hotels';
import { updateHotel } from './handlers/update_hotel';
import { deleteHotel } from './handlers/delete_hotel';
import { getBookingSummary } from './handlers/get_booking_summary';
import { createBooking } from './handlers/create_booking';
import { getBookings } from './handlers/get_bookings';
import { getInvoiceDetail } from './handlers/get_invoice_detail';
import { createPayment } from './handlers/create_payment';
import { getProfitLossReport } from './handlers/get_profit_loss_report';
import { getMonthlyBookingReport } from './handlers/get_monthly_booking_report';
import { getOutstandingInvoices } from './handlers/get_outstanding_invoices';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer management routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),
  
  deleteCustomer: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteCustomer(input)),

  // Hotel management routes
  createHotel: publicProcedure
    .input(createHotelInputSchema)
    .mutation(({ input }) => createHotel(input)),
  
  getHotels: publicProcedure
    .query(() => getHotels()),
  
  updateHotel: publicProcedure
    .input(updateHotelInputSchema)
    .mutation(({ input }) => updateHotel(input)),
  
  deleteHotel: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteHotel(input)),

  // Booking management routes
  getBookingSummary: publicProcedure
    .input(createBookingInputSchema)
    .query(({ input }) => getBookingSummary(input)),
  
  createBooking: publicProcedure
    .input(createBookingInputSchema)
    .mutation(({ input }) => createBooking(input)),
  
  getBookings: publicProcedure
    .query(() => getBookings()),

  // Invoice and payment routes
  getInvoiceDetail: publicProcedure
    .input(z.string())
    .query(({ input }) => getInvoiceDetail(input)),
  
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),

  // Reporting routes
  getProfitLossReport: publicProcedure
    .query(() => getProfitLossReport()),
  
  getMonthlyBookingReport: publicProcedure
    .input(monthlyReportFilterSchema.optional())
    .query(({ input }) => getMonthlyBookingReport(input)),
  
  getOutstandingInvoices: publicProcedure
    .query(() => getOutstandingInvoices()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Hotel Booking Management TRPC server listening at port: ${port}`);
}

start();
