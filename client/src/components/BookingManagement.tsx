
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, CalendarCheck, Eye, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Booking, Customer, Hotel, CreateBookingInput, BookingSummary } from '../../../server/src/schema';

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [formData, setFormData] = useState<CreateBookingInput>({
    customer_id: 0,
    hotel_id: 0,
    check_in_date: new Date(),
    check_out_date: new Date(),
    room_count: 1
  });

  const loadData = useCallback(async () => {
    try {
      const [bookingsResult, customersResult, hotelsResult] = await Promise.all([
        trpc.getBookings.query(),
        trpc.getCustomers.query(),
        trpc.getHotels.query()
      ]);
      setBookings(bookingsResult);
      setCustomers(customersResult);
      setHotels(hotelsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePreviewBooking = async () => {
    if (!formData.customer_id || !formData.hotel_id) {
      alert('Silakan pilih pelanggan dan hotel terlebih dahulu');
      return;
    }

    try {
      const summary = await trpc.getBookingSummary.query(formData);
      setBookingSummary(summary);
      setIsSummaryDialogOpen(true);
    } catch (error) {
      console.error('Failed to get booking summary:', error);
      alert('Gagal memuat ringkasan pemesanan');
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingSummary) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createBooking.mutate(formData);
      setBookings((prev: Booking[]) => [...prev, response]);
      resetForm();
      setIsSummaryDialogOpen(false);
      alert(`Pemesanan berhasil dibuat dengan nomor invoice: ${response.invoice_number}`);
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Gagal membuat pemesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      hotel_id: 0,
      check_in_date: new Date(),
      check_out_date: new Date(),
      room_count: 1
    });
    setBookingSummary(null);
    setIsDialogOpen(false);
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : 'N/A';
  };

  const getHotelName = (hotelId: number) => {
    const hotel = hotels.find((h: Hotel) => h.id === hotelId);
    return hotel ? hotel.name : 'N/A';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID');
  };

  const formatDateForInput = (date: Date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Manajemen Pemesanan Hotel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">Daftar Pemesanan</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Pemesanan Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Pemesanan Hotel Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Pelanggan</Label>
                      <Select
                        value={formData.customer_id.toString()}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateBookingInput) => ({ ...prev, customer_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pelanggan" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer: Customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hotel">Hotel</Label>
                      <Select
                        value={formData.hotel_id.toString()}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateBookingInput) => ({ ...prev, hotel_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((hotel: Hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id.toString()}>
                              {hotel.name} - {hotel.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="check_in">Tanggal Check-in</Label>
                      <Input
                        id="check_in"
                        type="date"
                        value={formatDateForInput(formData.check_in_date)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookingInput) => ({ ...prev, check_in_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_out">Tanggal Check-out</Label>
                      <Input
                        id="check_out"
                        type="date"
                        value={formatDateForInput(formData.check_out_date)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateBookingInput) => ({ ...prev, check_out_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room_count">Jumlah Kamar</Label>
                    <Input
                      id="room_count"
                      type="number"
                      value={formData.room_count}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBookingInput) => ({ ...prev, room_count: parseInt(e.target.value) || 1 }))
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="button" onClick={handlePreviewBooking}>
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Ringkasan
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Booking Summary Dialog */}
          <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ringkasan Pemesanan
                </DialogTitle>
              </DialogHeader>
              {bookingSummary && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Detail Pelanggan</h4>
                    <p className="text-sm text-blue-800">{bookingSummary.customer.name}</p>
                    <p className="text-sm text-blue-700">{bookingSummary.customer.email}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Detail Hotel</h4>
                    <p className="text-sm text-green-800">{bookingSummary.hotel.name}</p>
                    <p className="text-sm text-green-700">{bookingSummary.hotel.location}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{bookingSummary.hotel.room_type}</Badge>
                      <Badge variant="secondary">{bookingSummary.hotel.meal_package}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Check-in:</span>
                      <span className="text-sm font-medium">{formatDate(bookingSummary.check_in_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Check-out:</span>
                      <span className="text-sm font-medium">{formatDate(bookingSummary.check_out_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Jumlah Malam:</span>
                      <span className="text-sm font-medium">{bookingSummary.nights} malam</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Jumlah Kamar:</span>
                      <span className="text-sm font-medium">{bookingSummary.room_count} kamar</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Harga per malam:</span>
                      <span className="text-sm">SAR {bookingSummary.selling_price_per_night.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Harga:</span>
                      <span className="text-green-600">SAR {bookingSummary.total_selling_price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsSummaryDialogOpen(false)}
                    >
                      Kembali
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleConfirmBooking}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Memproses...' : 'Konfirmasi Pemesanan'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CalendarCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pemesanan. Silakan buat pemesanan baru.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead className="text-right">Total Harga</TableHead>
                  <TableHead>Tanggal Pemesanan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: Booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">{booking.invoice_number}</TableCell>
                    <TableCell>{getCustomerName(booking.customer_id)}</TableCell>
                    <TableCell>{getHotelName(booking.hotel_id)}</TableCell>
                    <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                    <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                    <TableCell>{booking.room_count}</TableCell>
                    <TableCell className="text-right font-medium">SAR {booking.total_price.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(booking.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
