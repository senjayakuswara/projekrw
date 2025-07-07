
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch, getDocs } from "firebase/firestore";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Schemas
const keluargaSchema = z.object({
  noKK: z.string().length(16, { message: "No. KK harus 16 digit." }),
  kepalaKeluarga: z.string().min(1, { message: "Nama Kepala Keluarga tidak boleh kosong." }),
  alamat: z.string().min(1, { message: "Alamat tidak boleh kosong." }),
});

const anggotaSchema = z.object({
  nama: z.string().min(1, { message: "Nama tidak boleh kosong." }),
  nik: z.string().length(16, { message: "NIK harus 16 digit." }),
  statusHubungan: z.enum(["Kepala Keluarga", "Istri", "Anak", "Lainnya"]),
});

// Types
type Anggota = z.infer<typeof anggotaSchema> & { id: string };
type Keluarga = z.infer<typeof keluargaSchema> & { id: string; anggota?: Anggota[] };

export default function DataKeluargaPage() {
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // State for Forms and Dialogs
  const [isKeluargaFormOpen, setKeluargaFormOpen] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<Keluarga | null>(null);
  const [isAnggotaFormOpen, setAnggotaFormOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);
  const [currentKeluargaId, setCurrentKeluargaId] = useState<string | null>(null);

  const keluargaForm = useForm<z.infer<typeof keluargaSchema>>({
    resolver: zodResolver(keluargaSchema),
  });

  const anggotaForm = useForm<z.infer<typeof anggotaSchema>>({
    resolver: zodResolver(anggotaSchema),
  });

  // Fetch Keluarga Data
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "keluarga"), (snapshot) => {
      const keluargaData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Keluarga));
      setKeluargaList(keluargaData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching keluarga:", error);
      toast({ variant: "destructive", title: "Gagal Memuat Data", description: "Tidak dapat mengambil data keluarga." });
      setLoading(false);
    });
    return () => unsub();
  }, [toast]);
  
  // Fetch Anggota for a specific Keluarga
  const fetchAnggota = useCallback((keluargaId: string) => {
    const anggotaColRef = collection(db, "keluarga", keluargaId, "anggota");
    return onSnapshot(anggotaColRef, (snapshot) => {
        const anggotaData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Anggota));
        setKeluargaList(prevList => prevList.map(keluarga => 
            keluarga.id === keluargaId ? { ...keluarga, anggota: anggotaData } : keluarga
        ));
    });
  }, []);

  // Handlers for Keluarga
  const handleKeluargaDialogOpen = (keluarga: Keluarga | null = null) => {
    setEditingKeluarga(keluarga);
    keluargaForm.reset(keluarga || { noKK: "", kepalaKeluarga: "", alamat: "" });
    setKeluargaFormOpen(true);
  };

  const onKeluargaSubmit = async (values: z.infer<typeof keluargaSchema>) => {
    try {
      if (editingKeluarga) {
        await updateDoc(doc(db, "keluarga", editingKeluarga.id), values);
        toast({ title: "Berhasil", description: "Data keluarga berhasil diperbarui." });
      } else {
        await addDoc(collection(db, "warga"), values); // legacy collection, should be "keluarga"
        await addDoc(collection(db, "keluarga"), values);
        toast({ title: "Berhasil", description: "Keluarga baru berhasil ditambahkan." });
      }
      setKeluargaFormOpen(false);
    } catch (error) {
      console.error("Error saving keluarga: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan data keluarga." });
    }
  };

  const handleDeleteKeluarga = async (keluargaId: string) => {
    try {
      const batch = writeBatch(db);
      const anggotaColRef = collection(db, "keluarga", keluargaId, "anggota");
      const anggotaSnapshot = await getDocs(anggotaColRef);
      anggotaSnapshot.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, "keluarga", keluargaId));
      await batch.commit();
      toast({ title: "Berhasil", description: "Data keluarga dan seluruh anggotanya berhasil dihapus." });
    } catch (error) {
      console.error("Error deleting keluarga: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menghapus data keluarga." });
    }
  };

  // Handlers for Anggota
  const handleAnggotaDialogOpen = (keluargaId: string, anggota: Anggota | null = null) => {
    setCurrentKeluargaId(keluargaId);
    setEditingAnggota(anggota);
    anggotaForm.reset(anggota || { nama: "", nik: "", statusHubungan: "Anak" });
    setAnggotaFormOpen(true);
  };
  
  const onAnggotaSubmit = async (values: z.infer<typeof anggotaSchema>) => {
    if (!currentKeluargaId) return;
    try {
      const anggotaColRef = collection(db, "keluarga", currentKeluargaId, "anggota");
      if (editingAnggota) {
        await updateDoc(doc(anggotaColRef, editingAnggota.id), values);
        toast({ title: "Berhasil", description: "Data anggota keluarga berhasil diperbarui." });
      } else {
        await addDoc(anggotaColRef, values);
        toast({ title: "Berhasil", description: "Anggota keluarga baru berhasil ditambahkan." });
      }
      setAnggotaFormOpen(false);
    } catch (error) {
      console.error("Error saving anggota: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan data anggota." });
    }
  };

  const handleDeleteAnggota = async (keluargaId: string, anggotaId: string) => {
    try {
      await deleteDoc(doc(db, "keluarga", keluargaId, "anggota", anggotaId));
      toast({ title: "Berhasil", description: "Data anggota keluarga berhasil dihapus." });
    } catch (error) {
      console.error("Error deleting anggota: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menghapus data." });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Kartu Keluarga</h1>
          <p className="text-muted-foreground">Kelola data keluarga di lingkungan Anda.</p>
        </div>
        <Button onClick={() => handleKeluargaDialogOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Keluarga
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Keluarga</CardTitle>
          <CardDescription>Klik pada setiap keluarga untuk melihat dan mengelola anggota keluarganya.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : keluargaList.length > 0 ? (
            <Accordion type="single" collapsible className="w-full" onValueChange={id => id && fetchAnggota(id)}>
              {keluargaList.map((keluarga) => (
                <AccordionItem value={keluarga.id} key={keluarga.id}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-left">
                            <p className="font-semibold text-primary">{keluarga.kepalaKeluarga}</p>
                            <p className="text-sm text-muted-foreground">No. KK: {keluarga.noKK}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline"> {keluarga.anggota?.length || 0} Anggota</Badge>
                            <AlertDialog>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Buka menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi Keluarga</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleKeluargaDialogOpen(keluarga)}}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Edit Keluarga</span>
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Hapus Keluarga</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Keluarga?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Tindakan ini akan menghapus data keluarga <span className="font-semibold">{keluarga.kepalaKeluarga}</span> beserta seluruh anggotanya secara permanen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteKeluarga(keluarga.id)} className="bg-destructive hover:bg-destructive/90">
                                    Ya, Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-slate-50 p-4 rounded-b-md">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold">Daftar Anggota Keluarga</h4>
                          <Button variant="outline" size="sm" onClick={() => handleAnggotaDialogOpen(keluarga.id)}>
                              <Users className="mr-2 h-4 w-4"/>
                              Tambah Anggota
                          </Button>
                      </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIK</TableHead>
                          <TableHead>Status Hubungan</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keluarga.anggota && keluarga.anggota.length > 0 ? (
                          keluarga.anggota.map(anggota => (
                            <TableRow key={anggota.id}>
                              <TableCell className="font-medium">{anggota.nama}</TableCell>
                              <TableCell>{anggota.nik}</TableCell>
                              <TableCell><Badge variant="secondary">{anggota.statusHubungan}</Badge></TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Aksi Anggota</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleAnggotaDialogOpen(keluarga.id, anggota)}>
                                            <Edit className="mr-2 h-4 w-4" /><span>Edit</span>
                                        </DropdownMenuItem>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" /><span>Hapus</span>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Yakin ingin menghapus <span className="font-semibold">{anggota.nama}</span> dari keluarga ini?
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteAnggota(keluarga.id, anggota.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                    </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={4} className="text-center h-24">Belum ada anggota keluarga.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground h-24 flex items-center justify-center">Belum ada data keluarga. Silakan tambahkan data baru.</div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Keluarga Form */}
      <Dialog open={isKeluargaFormOpen} onOpenChange={setKeluargaFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingKeluarga ? "Edit Data Keluarga" : "Tambah Keluarga Baru"}</DialogTitle>
            <DialogDescription>Lengkapi data keluarga di bawah ini.</DialogDescription>
          </DialogHeader>
          <Form {...keluargaForm}>
            <form onSubmit={keluargaForm.handleSubmit(onKeluargaSubmit)} className="space-y-4 py-4">
                <FormField control={keluargaForm.control} name="noKK" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nomor Kartu Keluarga (KK)</FormLabel>
                        <FormControl><Input placeholder="16 digit nomor KK" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={keluargaForm.control} name="kepalaKeluarga" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nama Kepala Keluarga</FormLabel>
                        <FormControl><Input placeholder="Contoh: Budi Santoso" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={keluargaForm.control} name="alamat" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Alamat</FormLabel>
                        <FormControl><Input placeholder="Contoh: Blok A No. 1" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                    <Button type="submit" disabled={keluargaForm.formState.isSubmitting}>
                        {keluargaForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for Anggota Form */}
      <Dialog open={isAnggotaFormOpen} onOpenChange={setAnggotaFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAnggota ? "Edit Anggota Keluarga" : "Tambah Anggota Keluarga"}</DialogTitle>
            <DialogDescription>Lengkapi data anggota di bawah ini.</DialogDescription>
          </DialogHeader>
          <Form {...anggotaForm}>
            <form onSubmit={anggotaForm.handleSubmit(onAnggotaSubmit)} className="space-y-4 py-4">
                <FormField control={anggotaForm.control} name="nama" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl><Input placeholder="Nama anggota keluarga" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={anggotaForm.control} name="nik" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nomor Induk Kependudukan (NIK)</FormLabel>
                        <FormControl><Input placeholder="16 digit NIK" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={anggotaForm.control} name="statusHubungan" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status Hubungan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Kepala Keluarga">Kepala Keluarga</SelectItem>
                            <SelectItem value="Istri">Istri</SelectItem>
                            <SelectItem value="Anak">Anak</SelectItem>
                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                    <Button type="submit" disabled={anggotaForm.formState.isSubmitting}>
                        {anggotaForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    