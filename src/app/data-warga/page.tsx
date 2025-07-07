
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Schema for form validation
const wargaSchema = z.object({
  nama: z.string().min(1, { message: "Nama tidak boleh kosong." }),
  noKK: z.string().min(16, { message: "No. KK harus 16 digit." }).max(16, { message: "No. KK harus 16 digit." }),
  alamat: z.string().min(1, { message: "Alamat tidak boleh kosong." }),
  status: z.enum(["Tetap", "Kontrak"]),
});

type Warga = z.infer<typeof wargaSchema> & { id: string };

export default function DataWargaPage() {
  const [dataWarga, setDataWarga] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingWarga, setEditingWarga] = useState<Warga | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof wargaSchema>>({
    resolver: zodResolver(wargaSchema),
    defaultValues: {
      nama: "",
      noKK: "",
      alamat: "",
      status: "Tetap",
    },
  });

  // Fetch data from Firestore in real-time
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "warga"), (snapshot) => {
      const wargaData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warga));
      setDataWarga(wargaData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching data:", error);
        toast({
            variant: "destructive",
            title: "Gagal Memuat Data",
            description: "Tidak dapat mengambil data dari server."
        })
        setLoading(false);
    });
    return () => unsub();
  }, [toast]);

  const handleDialogOpen = (warga: Warga | null = null) => {
    setEditingWarga(warga);
    if (warga) {
      form.reset(warga);
    } else {
      form.reset({
        nama: "",
        noKK: "",
        alamat: "",
        status: "Tetap",
      });
    }
    setFormOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof wargaSchema>) => {
    try {
      if (editingWarga) {
        const wargaDocRef = doc(db, "warga", editingWarga.id);
        await updateDoc(wargaDocRef, values);
        toast({
          title: "Berhasil",
          description: "Data warga berhasil diperbarui.",
        });
      } else {
        await addDoc(collection(db, "warga"), values);
        toast({
          title: "Berhasil",
          description: "Warga baru berhasil ditambahkan.",
        });
      }
      setFormOpen(false);
      setEditingWarga(null);
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan saat menyimpan data.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "warga", id));
      toast({
        title: "Berhasil",
        description: "Data warga berhasil dihapus.",
      });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Warga</h1>
          <p className="text-muted-foreground">Kelola data warga di lingkungan Anda.</p>
        </div>
        <Button onClick={() => handleDialogOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Warga
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingWarga ? "Edit Data Warga" : "Tambah Warga Baru"}</DialogTitle>
            <DialogDescription>
              {editingWarga ? "Ubah informasi di bawah ini." : "Isi formulir di bawah ini untuk menambahkan warga baru."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Budi Santoso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noKK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Kartu Keluarga (KK)</FormLabel>
                    <FormControl>
                      <Input placeholder="16 digit nomor KK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Blok A No. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Tinggal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status tinggal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tetap">Tetap</SelectItem>
                        <SelectItem value="Kontrak">Kontrak</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Batal
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Warga</CardTitle>
          <CardDescription>Berikut adalah daftar warga yang terdata dalam sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. KK</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : dataWarga.length > 0 ? (
                dataWarga.map((warga) => (
                  <TableRow key={warga.id}>
                    <TableCell className="font-medium">{warga.nama}</TableCell>
                    <TableCell>{warga.noKK}</TableCell>
                    <TableCell>{warga.alamat}</TableCell>
                    <TableCell>
                      <Badge variant={warga.status === 'Tetap' ? 'default' : 'secondary'}>{warga.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Buka menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleDialogOpen(warga)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Hapus</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data warga <span className="font-semibold">{warga.nama}</span> secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(warga.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                       </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Belum ada data warga. Silakan tambahkan data baru.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
