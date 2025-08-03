
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Hotel, CreateHotelInput, UpdateHotelInput, RoomType, MealPackage } from '../../../server/src/schema';

export function HotelManagement() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState<CreateHotelInput>({
    name: '',
    location: '',
    room_type: 'double',
    meal_package: 'fullboard',
    base_price: 0,
    markup_percentage: 0
  });

  const loadHotels = useCallback(async () => {
    try {
      const result = await trpc.getHotels.query();
      setHotels(result);
    } catch (error) {
      console.error('Failed to load hotels:', error);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingHotel) {
        const updateData: UpdateHotelInput = {
          id: editingHotel.id,
          ...formData
        };
        const response = await trpc.updateHotel.mutate(updateData);
        setHotels((prev: Hotel[]) => 
          prev.map((hotel: Hotel) => 
            hotel.id === editingHotel.id ? response : hotel
          )
        );
      } else {
        const response = await trpc.createHotel.mutate(formData);
        setHotels((prev: Hotel[]) => [...prev, response]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save hotel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      location: hotel.location,
      room_type: hotel.room_type,
      meal_package: hotel.meal_package,
      base_price: hotel.base_price,
      markup_percentage: hotel.markup_percentage
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (hotelId: number) => {
    try {
      await trpc.deleteHotel.mutate({ id: hotelId });
      setHotels((prev: Hotel[]) => 
        prev.filter((hotel: Hotel) => hotel.id !== hotelId)
      );
    } catch (error) {
      console.error('Failed to delete hotel:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      room_type: 'double',
      meal_package: 'fullboard',
      base_price: 0,
      markup_percentage: 0
    });
    setEditingHotel(null);
    setIsDialogOpen(false);
  };

  const calculateSellingPrice = (basePrice: number, markupPercentage: number) => {
    return basePrice + (basePrice * markupPercentage / 100);
  };

  const getRoomTypeLabel = (roomType: RoomType) => {
    const labels = {
      double: 'Double Room',
      triple: 'Triple Room',
      quad: 'Quad Room'
    };
    return labels[roomType];
  };

  const getMealPackageLabel = (mealPackage: MealPackage) => {
    const labels = {
      fullboard: 'Full Board',
      halfboard: 'Half Board'
    };
    return labels[mealPackage];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manajemen Hotel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">Daftar Hotel</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Hotel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingHotel ? 'Edit Hotel' : 'Tambah Hotel Baru'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Hotel</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateHotelInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Masukkan nama hotel"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasi</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateHotelInput) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="Masukkan lokasi hotel"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room_type">Tipe Kamar</Label>
                      <Select
                        value={formData.room_type || 'double'}
                        onValueChange={(value: RoomType) =>
                          setFormData((prev: CreateHotelInput) => ({ ...prev, room_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe kamar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="double">Double Room</SelectItem>
                          <SelectItem value="triple">Triple Room</SelectItem>
                          <SelectItem value="quad">Quad Room</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meal_package">Paket Makan</Label>
                      <Select
                        value={formData.meal_package || 'fullboard'}
                        onValueChange={(value: MealPackage) =>
                          setFormData((prev: CreateHotelInput) => ({ ...prev, meal_package: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket makan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullboard">Full Board</SelectItem>
                          <SelectItem value="halfboard">Half Board</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_price">Harga Pokok (SAR)</Label>
                      <Input
                        id="base_price"
                        type="number"
                        value={formData.base_price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateHotelInput) => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markup_percentage">Markup (%)</Label>
                      <Input
                        id="markup_percentage"
                        type="number"
                        value={formData.markup_percentage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateHotelInput) => ({ ...prev, markup_percentage: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="0"
                        step="0.1"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <Label className="text-sm font-medium text-gray-700">
                      Harga Jual: SAR {calculateSellingPrice(formData.base_price, formData.markup_percentage).toFixed(2)}
                    </Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Menyimpan...' : editingHotel ? 'Update' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {hotels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data hotel. Silakan tambah hotel baru.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Hotel</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Tipe Kamar</TableHead>
                  <TableHead>Paket Makan</TableHead>
                  <TableHead className="text-right">Harga Pokok</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((hotel: Hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>{hotel.location}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoomTypeLabel(hotel.room_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getMealPackageLabel(hotel.meal_package)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">SAR {hotel.base_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{hotel.markup_percentage}%</TableCell>
                    <TableCell className="text-right font-medium">
                      SAR {calculateSellingPrice(hotel.base_price, hotel.markup_percentage).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(hotel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Hotel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus hotel "{hotel.name}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(hotel.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
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
