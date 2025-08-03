
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, FileText, Download, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ProfitLossReport, MonthlyBookingReport, OutstandingInvoice, MonthlyReportFilter } from '../../../server/src/schema';

export function ReportsManagement() {
  const [profitLossReports, setProfitLossReports] = useState<ProfitLossReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyBookingReport[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
  const [monthlyFilter, setMonthlyFilter] = useState<MonthlyReportFilter>({});

  const loadProfitLossReport = useCallback(async () => {
    try {
      const result = await trpc.getProfitLossReport.query();
      setProfitLossReports(result);
    } catch (error) {
      console.error('Failed to load profit loss report:', error);
    }
  }, []);

  const loadMonthlyReport = useCallback(async () => {
    try {
      const result = await trpc.getMonthlyBookingReport.query(monthlyFilter);
      setMonthlyReports(result);
    } catch (error) {
      console.error('Failed to load monthly report:', error);
    }
  }, [monthlyFilter]);

  const loadOutstandingInvoices = useCallback(async () => {
    try {
      const result = await trpc.getOutstandingInvoices.query();
      setOutstandingInvoices(result);
    } catch (error) {
      console.error('Failed to load outstanding invoices:', error);
    }
  }, []);

  useEffect(() => {
    loadProfitLossReport();
    loadMonthlyReport();
    loadOutstandingInvoices();
  }, [loadProfitLossReport, loadMonthlyReport, loadOutstandingInvoices]);

  const handleFilterMonthlyReport = () => {
    loadMonthlyReport();
  };

  const exportToPDF = (reportType: string) => {
    // STUB: PDF export functionality - would integrate with PDF generation library
    alert(`STUB: Export ${reportType} ke PDF akan diintegrasikan dengan library PDF generation`);
    console.log(`Export ${reportType} to PDF`);
  };

  const getTotalProfit = () => {
    return profitLossReports.reduce((sum: number, report: ProfitLossReport) => sum + report.profit, 0);
  };

  const getTotalRevenue = () => {
    return profitLossReports.reduce((sum: number, report: ProfitLossReport) => sum + report.selling_price, 0);
  };

  const getTotalOutstanding = () => {
    return outstandingInvoices.reduce((sum: number, invoice: OutstandingInvoice) => sum + invoice.outstanding_amount, 0);
  };

  const getMonthName = (monthNumber: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNumber - 1] || '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Laporan Keuangan & Analitik
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Total Profit</p>
                    <p className="text-2xl font-bold text-green-800">SAR {getTotalProfit().toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-800">SAR {getTotalRevenue().toFixed(2)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Outstanding</p>
                    <p className="text-2xl font-bold text-red-800">SAR {getTotalOutstanding().toFixed(2)}</p>
                  </div>
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Tabs */}
          <Tabs defaultValue="profit-loss" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profit-loss">Laporan Laba Rugi</TabsTrigger>
              <TabsTrigger value="monthly">Rekap Bulanan</TabsTrigger>
              <TabsTrigger value="outstanding">Invoice Belum Lunas</TabsTrigger>
            </TabsList>

            {/* Profit Loss Report */}
            <TabsContent value="profit-loss" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Laporan Laba Rugi per Invoice</CardTitle>
                  <Button 
                    onClick={() => exportToPDF('Profit Loss Report')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  {profitLossReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada data laporan laba rugi.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Invoice</TableHead>
                          <TableHead>Pelanggan</TableHead>
                          <TableHead>Hotel</TableHead>
                          <TableHead className="text-right">Harga Pokok</TableHead>
                          <TableHead className="text-right">Harga Jual</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                          <TableHead>Tanggal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profitLossReports.map((report: ProfitLossReport) => (
                          <TableRow key={report.invoice_number}>
                            <TableCell className="font-mono text-sm">{report.invoice_number}</TableCell>
                            <TableCell>{report.customer_name}</TableCell>
                            <TableCell>{report.hotel_name}</TableCell>
                            <TableCell className="text-right">SAR {report.base_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">SAR {report.selling_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <span className={`font-medium ${report.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                SAR {report.profit.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(report.booking_date).toLocaleDateString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Booking Report */}
            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Filter Laporan Bulanan</CardTitle>
                  <div className="flex gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor="year">Tahun</Label>
                      <Input
                        id="year"
                        type="number"
                        value={monthlyFilter.year || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMonthlyFilter((prev: MonthlyReportFilter) => ({ ...prev, year: parseInt(e.target.value) || undefined }))
                        }
                        placeholder="2024"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="month">Bulan</Label>
                      <Select
                        value={monthlyFilter.month?.toString() || 'all'}
                        onValueChange={(value: string) =>
                          setMonthlyFilter((prev: MonthlyReportFilter) => ({ ...prev, month: value === 'all' ? undefined : parseInt(value) }))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Semua Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Bulan</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {getMonthName(i + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleFilterMonthlyReport}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Rekap Pemesanan Hotel per Bulan</h3>
                    <Button 
                      onClick={() => exportToPDF('Monthly Booking Report')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                  
                  {monthlyReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Belum ada data rekap bulanan.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Periode</TableHead>
                          <TableHead className="text-right">Jumlah Pemesanan</TableHead>
                          <TableHead className="text-right">Total Revenue</TableHead>
                          <TableHead className="text-right">Total Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyReports.map((report: MonthlyBookingReport) => (
                          <TableRow key={`${report.year}-${report.month}`}>
                            <TableCell className="font-medium">{getMonthName(parseInt(report.month))} {report.year}</TableCell>
                            <TableCell className="text-right">{report.booking_count}</TableCell>
                            <TableCell className="text-right">SAR {report.total_revenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium text-green-600">
                                SAR {report.total_profit.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outstanding Invoices */}
            <TabsContent value="outstanding" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Daftar Invoice Belum Lunas</CardTitle>
                  <Button 
                    onClick={() => exportToPDF('Outstanding Invoices')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </CardHeader>
                <CardContent>
                  {outstandingInvoices.length === 0 ? (
                    <div className="text-center py-8 text-green-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Semua invoice sudah lunas! 🎉</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No. Invoice</TableHead>
                          <TableHead>Pelanggan</TableHead>
                          <TableHead>Hotel</TableHead>
                          <TableHead className="text-right">Total Tagihan</TableHead>
                          <TableHead className="text-right">Dibayar</TableHead>
                          <TableHead className="text-right">Sisa Tagihan</TableHead>
                          <TableHead>Tanggal Pemesanan</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingInvoices.map((invoice: OutstandingInvoice) => (
                          <TableRow key={invoice.invoice_number}>
                            <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.customer_name}</TableCell>
                            <TableCell>{invoice.hotel_name}</TableCell>
                            <TableCell className="text-right">SAR {invoice.total_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">SAR {invoice.paid_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium text-red-600">
                                SAR {invoice.outstanding_amount.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(invoice.booking_date).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Belum Lunas</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
