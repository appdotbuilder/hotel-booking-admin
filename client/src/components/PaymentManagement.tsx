
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Search, Plus, FileText, Printer } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Payment, CreatePaymentInput, InvoiceDetail, PaymentMethod } from '../../../server/src/schema';

export function PaymentManagement() {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<CreatePaymentInput>({
    booking_id: 0,
    amount: 0,
    payment_method: 'cash'
  });

  const handleSearchInvoice = async () => {
    if (!invoiceNumber.trim()) {
      alert('Silakan masukkan nomor invoice');
      return;
    }

    setIsLoading(true);
    try {
      const detail = await trpc.getInvoiceDetail.query(invoiceNumber.trim());
      if (detail) {
        setInvoiceDetail(detail);
        setPaymentData((prev: CreatePaymentInput) => ({
          ...prev,
          booking_id: detail.booking.id
        }));
      } else {
        setInvoiceDetail(null);
        alert('Invoice tidak ditemukan');
      }
    } catch (error) {
      console.error('Failed to get invoice detail:', error);
      alert('Invoice tidak ditemukan');
      setInvoiceDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceDetail) return;

    setIsLoading(true);
    try {
      const response = await trpc.createPayment.mutate(paymentData);
      
      // Update invoice detail with new payment
      const updatedDetail = {
        ...invoiceDetail,
        payments: [...invoiceDetail.payments, response],
        total_paid: invoiceDetail.total_paid + response.amount,
        outstanding_balance: invoiceDetail.outstanding_balance - response.amount
      };
      setInvoiceDetail(updatedDetail);
      
      // Reset form
      setPaymentData({
        booking_id: invoiceDetail.booking.id,
        amount: 0,
        payment_method: 'cash'
      });
      setIsPaymentDialogOpen(false);
      alert('Pembayaran berhasil diproses');
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Gagal memproses pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const labels = {
      cash: 'Tunai',
      card: 'Kartu',
      bank_transfer: 'Transfer Bank',
      online: 'Online'
    };
    return labels[method];
  };

  const getPaymentStatusBadge = (outstandingBalance: number) => {
    if (outstandingBalance <= 0) {
      return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
    } else {
      return <Badge variant="destructive">Belum Lunas</Badge>;
    }
  };

  const handlePrintInvoice = () => {
    if (!invoiceDetail) return;
    
    // STUB: Print functionality - would integrate with actual printing service
    alert('STUB: Fitur cetak invoice akan diintegrasikan dengan layanan printing');
    console.log('Print invoice:', invoiceDetail);
  };

  const handlePrintReceipt = (payment: Payment) => {
    // STUB: Print receipt functionality - would integrate with actual printing service
    alert('STUB: Fitur cetak bukti pembayaran akan diintegrasikan dengan layanan printing');
    console.log('Print receipt:', payment);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manajemen Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Invoice Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Cari Invoice</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Masukkan nomor invoice..."
                value={invoiceNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    handleSearchInvoice();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleSearchInvoice} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Mencari...' : 'Cari'}
              </Button>
            </div>
          </div>

          {/* Invoice Detail Section */}
          {invoiceDetail && (
            <div className="space-y-6">
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center justify-between">
                    <span>Detail Invoice: {invoiceDetail.booking.invoice_number}</span>
                    <div className="flex gap-2">
                      {getPaymentStatusBadge(invoiceDetail.outstanding_balance)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintInvoice}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Cetak Invoice
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Informasi Pelanggan</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Nama:</strong> {invoiceDetail.customer.name}</p>
                        <p><strong>Email:</strong> {invoiceDetail.customer.email}</p>
                        <p><strong>Telepon:</strong> {invoiceDetail.customer.phone}</p>
                        <p><strong>Alamat:</strong> {invoiceDetail.customer.address}</p>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-800">Informasi Hotel</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Hotel:</strong> {invoiceDetail.hotel.name}</p>
                        <p><strong>Lokasi:</strong> {invoiceDetail.hotel.location}</p>
                        <p><strong>Tipe Kamar:</strong> {invoiceDetail.hotel.room_type}</p>
                        <p><strong>Paket Makan:</strong> {invoiceDetail.hotel.meal_package}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Booking Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in:</span>
                      <p className="font-medium">{new Date(invoiceDetail.booking.check_in_date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out:</span>
                      <p className="font-medium">{new Date(invoiceDetail.booking.check_out_date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Jumlah Kamar:</span>
                      <p className="font-medium">{invoiceDetail.booking.room_count}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Harga:</span>
                      <p className="font-medium">SAR {invoiceDetail.booking.total_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Payment Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Tagihan</p>
                        <p className="text-lg font-bold">SAR {invoiceDetail.booking.total_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Dibayar</p>
                        <p className="text-lg font-bold text-green-600">SAR {invoiceDetail.total_paid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sisa Tagihan</p>
                        <p className={`text-lg font-bold ${invoiceDetail.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          SAR {invoiceDetail.outstanding_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Payment Button */}
                  {invoiceDetail.outstanding_balance > 0 && (
                    <div className="mt-4 text-center">
                      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Pembayaran
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Tambah Pembayaran</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handlePayment} className="space-y-4">
                            <div className="space-y-2">
                
                              <Label htmlFor="amount">Jumlah Pembayaran (SAR)</Label>
                              <Input
                                id="amount"
                                type="number"
                                value={paymentData.amount}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setPaymentData((prev: CreatePaymentInput) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                                }
                                placeholder="0.00"
                                step="0.01"
                                min="0.01"
                                max={invoiceDetail.outstanding_balance}
                                required
                              />
                              <p className="text-sm text-gray-500">
                                Maksimal: SAR {invoiceDetail.outstanding_balance.toFixed(2)}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payment_method">Metode Pembayaran</Label>
                              <Select
                                value={paymentData.payment_method || 'cash'}
                                onValueChange={(value: PaymentMethod) =>
                                  setPaymentData((prev: CreatePaymentInput) => ({ ...prev, payment_method: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih metode pembayaran" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Tunai</SelectItem>
                                  <SelectItem value="card">Kartu</SelectItem>
                                  <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                                  <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsPaymentDialogOpen(false)}
                              >
                                Batal
                              </Button>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Memproses...' : 'Proses Pembayaran'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              {invoiceDetail.payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Riwayat Pembayaran</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Metode</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceDetail.payments.map((payment: Payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.payment_date).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="font-medium">SAR {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getPaymentMethodLabel(payment.payment_method)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintReceipt(payment)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Cetak Bukti
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
