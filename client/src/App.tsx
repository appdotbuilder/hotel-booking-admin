
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerManagement } from '@/components/CustomerManagement';
import { HotelManagement } from '@/components/HotelManagement';
import { BookingManagement } from '@/components/BookingManagement';
import { PaymentManagement } from '@/components/PaymentManagement';
import { ReportsManagement } from '@/components/ReportsManagement';
import { Users, Building2, CalendarCheck, CreditCard, BarChart3 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('customers');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏨 Hotel Booking Management
          </h1>
          <p className="text-gray-600">
            Sistem manajemen pemesanan hotel untuk agen perjalanan
          </p>
        </div>

        {/* Main Navigation */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100">
                <TabsTrigger 
                  value="customers" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4" />
                  Pelanggan
                </TabsTrigger>
                <TabsTrigger 
                  value="hotels"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Building2 className="h-4 w-4" />
                  Hotel
                </TabsTrigger>
                <TabsTrigger 
                  value="bookings"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Pemesanan
                </TabsTrigger>
                <TabsTrigger 
                  value="payments"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <CreditCard className="h-4 w-4" />
                  Pembayaran
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <BarChart3 className="h-4 w-4" />
                  Laporan
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="customers" className="space-y-4">
                  <CustomerManagement />
                </TabsContent>

                <TabsContent value="hotels" className="space-y-4">
                  <HotelManagement />
                </TabsContent>

                <TabsContent value="bookings" className="space-y-4">
                  <BookingManagement />
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <PaymentManagement />
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <ReportsManagement />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
