
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2, Users, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Schemas
const keluargaSchema = z.object({
  noKK: z.string().length(16, { message: "No. KK harus 16 digit." }),
  kepalaKeluarga: z.string().min(1, { message: "Nama Kepala Keluarga tidak boleh kosong." }),
  alamat: z.string().min(1, { message: "Alamat tidak boleh kosong." }),
});

const anggotaSchema = z.object({
  nama: z.string().min(1, { message: "Nama tidak boleh kosong." }),
  nik: z.string().length(16, { message: "NIK harus 16 digit." }),
  jenisKelamin: z.enum(["Laki-laki", "Perempuan"]),
  tempatLahir: z.string().min(1, "Tempat lahir tidak boleh kosong."),
  tanggalLahir: z.string().min(1, "Tanggal lahir tidak boleh kosong."),
  agama: z.string().min(1, "Agama tidak boleh kosong."),
  pendidikan: z.string().min(1, "Pendidikan tidak boleh kosong."),
  jenisPekerjaan: z.string().min(1, "Jenis pekerjaan tidak boleh kosong."),
  statusPerkawinan: z.enum(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]),
  statusHubungan: z.enum(["Kepala Keluarga", "Istri", "Anak", "Famili Lain"]),
  kewarganegaraan: z.string().min(1, "Kewarganegaraan tidak boleh kosong."),
  namaAyah: z.string().min(1, "Nama ayah tidak boleh kosong."),
  namaIbu: z.string().min(1, "Nama ibu tidak boleh kosong."),
});

// Types
type Anggota = z.infer<typeof anggotaSchema> & { id: string };
type Keluarga = z.infer<typeof keluargaSchema> & { id: string; anggota?: Anggota[] };

export default function DataWargaPage() {
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isKeluargaFormOpen, setKeluargaFormOpen] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<Keluarga | null>(null);
  
  const [isAnggotaFormOpen, setAnggotaFormOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);
  const [currentKeluargaId, setCurrentKeluargaId] = useState<string | null>(null);
  
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});

  const keluargaForm = useForm<z.infer<typeof keluargaSchema>>({
    resolver: zodResolver(keluargaSchema),
    defaultValues: { noKK: "", kepalaKeluarga: "", alamat: "" }
  });

  const anggotaForm = useForm<z.infer<typeof anggotaSchema>>({
    resolver: zodResolver(anggotaSchema),
    defaultValues: {
      nama: "",
      nik: "",
      jenisKelamin: "Laki-laki",
      tempatLahir: "",
      tanggalLahir: "",
      agama: "",
      pendidikan: "",
      jenisPekerjaan: "",
      statusPerkawinan: "Belum Kawin",
      statusHubungan: "Anak",
      kewarganegaraan: "WNI",
      namaAyah: "",
      namaIbu: "",
    }
  });

  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchAnggota = useCallback((keluargaId: string) => {
     const anggotaColRef = collection(db, "keluarga", keluargaId, "anggota");
     return onSnapshot(anggotaColRef, (snapshot) => {
         const anggotaData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Anggota));
         setKeluargaList(prevList => prevList.map(keluarga => 
             keluarga.id === keluargaId ? { ...keluarga, anggota: anggotaData.sort((a, b) => a.nama.localeCompare(b.nama)) } : keluarga
         ));
     });
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubKeluarga = onSnapshot(collection(db, "keluarga"), (snapshot) => {
      const keluargaData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Keluarga));
      setKeluargaList(keluargaData);

      const unsubAnggotaListeners: (() => void)[] = [];
      keluargaData.forEach(keluarga => {
        const unsub = fetchAnggota(keluarga.id);
        unsubAnggotaListeners.push(unsub);
      });

      setLoading(false);
      return () => unsubAnggotaListeners.forEach(unsub => unsub());
    }, (error) => {
      console.error("Error fetching keluarga:", error);
      toast({ variant: "destructive", title: "Gagal Memuat Data", description: "Tidak dapat mengambil data keluarga." });
      setLoading(false);
    });
    return () => unsubKeluarga();
  }, [toast, fetchAnggota]);
  
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
  
  const handleAnggotaDialogOpen = (keluargaId: string, anggota: Anggota | null = null) => {
    setCurrentKeluargaId(keluargaId);
    setEditingAnggota(anggota);
    anggotaForm.reset(anggota || { nama: "", nik: "", jenisKelamin: "Laki-laki", tempatLahir: "", tanggalLahir: "", agama: "", pendidikan: "", jenisPekerjaan: "", statusPerkawinan: "Belum Kawin", statusHubungan: "Anak", kewarganegaraan: "WNI", namaAyah: "", namaIbu: "" });
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
          <h1 className="text-3xl font-bold tracking-tight">Data Warga</h1>
          <p className="text-muted-foreground">Kelola data warga berdasarkan Kartu Keluarga.</p>
        </div>
        <Button onClick={() => handleKeluargaDialogOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Keluarga
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Keluarga</CardTitle>
          <CardDescription>Klik ikon panah untuk melihat anggota keluarga.</CardDescription>
        </CardHeader>
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>No. Kartu Keluarga</TableHead>
                <TableHead>Kepala Keluarga</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Jml. Anggota</TableHead>
                <TableHead className="text-right w-[150px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            
              {loading ? (
                <TableBody>
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></TableCell></TableRow>
                </TableBody>
              ) : keluargaList.length > 0 ? (
                keluargaList.map((keluarga) => (
                  <Collapsible asChild key={keluarga.id} open={openCollapsibles[keluarga.id] || false} onOpenChange={() => toggleCollapsible(keluarga.id)}>
                    <TableBody>
                      <TableRow className="bg-muted/20 hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0 data-[state=open]:rotate-90">
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{keluarga.noKK}</TableCell>
                        <TableCell>{keluarga.kepalaKeluarga}</TableCell>
                        <TableCell className="truncate max-w-xs">{keluarga.alamat}</TableCell>
                        <TableCell><Badge variant="secondary">{keluarga.anggota?.length || 0}</Badge></TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleAnggotaDialogOpen(keluarga.id)}>
                                <Users className="mr-2 h-4 w-4"/> Tambah Anggota
                            </Button>
                           <AlertDialog>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Buka menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi Keluarga</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleKeluargaDialogOpen(keluarga)}>
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
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <tr className="bg-background">
                            <TableCell colSpan={6} className="p-0">
                                <div className="p-4 bg-slate-50">
                                    <h4 className="font-semibold mb-2">Anggota Keluarga:</h4>
                                    {keluarga.anggota && keluarga.anggota.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>NIK</TableHead>
                                                    <TableHead>Hubungan</TableHead>
                                                    <TableHead>Jenis Kelamin</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {keluarga.anggota.map((anggota) => (
                                                    <TableRow key={anggota.id} className="bg-white">
                                                        <TableCell>{anggota.nama}</TableCell>
                                                        <TableCell>{anggota.nik}</TableCell>
                                                        <TableCell><Badge variant="outline">{anggota.statusHubungan}</Badge></TableCell>
                                                        <TableCell>{anggota.jenisKelamin}</TableCell>
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
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    <span>Edit</span>
                                                                    </DropdownMenuItem>
                                                                    <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        <span>Hapus</span>
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
                                                                    <AlertDialogAction
                                                                    onClick={() => handleDeleteAnggota(keluarga.id, anggota.id)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                    >
                                                                    Hapus
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center text-sm text-muted-foreground p-4">Belum ada data anggota untuk keluarga ini.</div>
                                    )}
                                </div>
                            </TableCell>
                        </tr>
                      </CollapsibleContent>
                    </TableBody>
                  </Collapsible>
                ))
              ) : (
                <TableBody>
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Belum ada data keluarga. Silakan tambahkan data baru.</TableCell></TableRow>
                </TableBody>
              )}
          </Table>
        </div>
      </Card>
      
      {/* Dialog for Keluarga Form */}
      <Dialog open={isKeluargaFormOpen} onOpenChange={setKeluargaFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingKeluarga ? "Edit Data Keluarga" : "Tambah Keluarga Baru"}</DialogTitle>
            <DialogDescription>Lengkapi data utama keluarga di bawah ini.</DialogDescription>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnggota ? "Edit Anggota Keluarga" : "Tambah Anggota Keluarga"}</DialogTitle>
            <DialogDescription>Lengkapi data lengkap anggota di bawah ini.</DialogDescription>
          </DialogHeader>
          <Form {...anggotaForm}>
            <form onSubmit={anggotaForm.handleSubmit(onAnggotaSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                <FormField control={anggotaForm.control} name="nama" render={({ field }) => (
                    <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={anggotaForm.control} name="nik" render={({ field }) => (
                    <FormItem><FormLabel>NIK</FormLabel><FormControl><Input placeholder="16 digit NIK" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={anggotaForm.control} name="jenisKelamin" render={({ field }) => (
                    <FormItem><FormLabel>Jenis Kelamin</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={anggotaForm.control} name="tempatLahir" render={({ field }) => (
                        <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={anggotaForm.control} name="tanggalLahir" render={({ field }) => (
                       <FormItem><FormLabel>Tanggal Lahir</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={anggotaForm.control} name="agama" render={({ field }) => (
                    <FormItem><FormLabel>Agama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={anggotaForm.control} name="pendidikan" render={({ field }) => (
                    <FormItem><FormLabel>Pendidikan Terakhir</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={anggotaForm.control} name="jenisPekerjaan" render={({ field }) => (
                    <FormItem><FormLabel>Jenis Pekerjaan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={anggotaForm.control} name="statusPerkawinan" render={({ field }) => (
                    <FormItem><FormLabel>Status Perkawinan</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Belum Kawin">Belum Kawin</SelectItem><SelectItem value="Kawin">Kawin</SelectItem><SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem><SelectItem value="Cerai Mati">Cerai Mati</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={anggotaForm.control} name="statusHubungan" render={({ field }) => (
                    <FormItem><FormLabel>Status Hubungan Keluarga</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Kepala Keluarga">Kepala Keluarga</SelectItem><SelectItem value="Istri">Istri</SelectItem><SelectItem value="Anak">Anak</SelectItem><SelectItem value="Famili Lain">Famili Lain</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={anggotaForm.control} name="kewarganegaraan" render={({ field }) => (
                    <FormItem><FormLabel>Kewarganegaraan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={anggotaForm.control} name="namaAyah" render={({ field }) => (
                        <FormItem><FormLabel>Nama Ayah</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={anggotaForm.control} name="namaIbu" render={({ field }) => (
                        <FormItem><FormLabel>Nama Ibu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter className="pt-4">
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
