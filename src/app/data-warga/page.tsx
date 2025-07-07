
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch, getDocs, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2, Users, Plus, Minus, Upload, Download, FileSpreadsheet, Search, Home, User, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// Schemas
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

const keluargaSchema = z.object({
  noKK: z.string().length(16, { message: "No. KK harus 16 digit." }),
  alamat: z.string().min(1, { message: "Alamat tidak boleh kosong." }),
}).merge(anggotaSchema);

// Types
type Anggota = z.infer<typeof anggotaSchema> & { id: string };
type Keluarga = { id: string; noKK: string; kepalaKeluarga: string; alamat: string; anggota?: Anggota[] };
type EditingKeluargaState = { keluarga: Keluarga, kepalaKeluargaData: Anggota | null } | null;

export default function DataWargaPage() {
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [isKeluargaFormOpen, setKeluargaFormOpen] = useState(false);
  const [editingKeluarga, setEditingKeluarga] = useState<EditingKeluargaState>(null);
  
  const [isAnggotaFormOpen, setAnggotaFormOpen] = useState(false);
  const [editingAnggota, setEditingAnggota] = useState<Anggota | null>(null);
  const [currentKeluargaId, setCurrentKeluargaId] = useState<string | null>(null);
  
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});

  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const keluargaForm = useForm<z.infer<typeof keluargaSchema>>({
    resolver: zodResolver(keluargaSchema),
    defaultValues: {
      noKK: "",
      alamat: "",
      nama: "",
      nik: "",
      jenisKelamin: "Laki-laki",
      tempatLahir: "",
      tanggalLahir: "",
      agama: "",
      pendidikan: "",
      jenisPekerjaan: "",
      statusPerkawinan: "Kawin",
      statusHubungan: "Kepala Keluarga",
      kewarganegaraan: "WNI",
      namaAyah: "",
      namaIbu: "",
    }
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

  const stats = useMemo(() => {
    const totalWarga = keluargaList.reduce((acc, curr) => acc + (curr.anggota?.length || 0), 0);
    let lakiLaki = 0;
    let perempuan = 0;
    keluargaList.forEach(k => {
      k.anggota?.forEach(a => {
        if (a.jenisKelamin === 'Laki-laki') lakiLaki++;
        if (a.jenisKelamin === 'Perempuan') perempuan++;
      });
    });

    return {
      totalKK: keluargaList.length,
      totalWarga,
      lakiLaki,
      perempuan,
    };
  }, [keluargaList]);

  const filteredKeluargaList = useMemo(() => {
    if (!searchTerm) return keluargaList;
    return keluargaList.filter(keluarga => 
      keluarga.kepalaKeluarga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      keluarga.noKK.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [keluargaList, searchTerm]);

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
    if (keluarga) {
      const kepalaKeluargaData = keluarga.anggota?.find(a => a.statusHubungan === "Kepala Keluarga");
      setEditingKeluarga({ keluarga, kepalaKeluargaData: kepalaKeluargaData || null });
      if (kepalaKeluargaData) {
        keluargaForm.reset({
          ...kepalaKeluargaData,
          noKK: keluarga.noKK,
          alamat: keluarga.alamat,
        });
      } else {
        keluargaForm.reset({
          ...(keluargaForm.formState.defaultValues || {}),
          noKK: keluarga.noKK,
          alamat: keluarga.alamat,
          nama: keluarga.kepalaKeluarga,
          statusHubungan: "Kepala Keluarga",
        });
      }
    } else {
      setEditingKeluarga(null);
      keluargaForm.reset(keluargaForm.formState.defaultValues);
    }
    setKeluargaFormOpen(true);
  };

  const onKeluargaSubmit = async (values: z.infer<typeof keluargaSchema>) => {
    const { noKK, alamat, nama, ...anggotaValues } = values;
    const batch = writeBatch(db);

    try {
      if (editingKeluarga) {
        const keluargaRef = doc(db, "keluarga", editingKeluarga.keluarga.id);
        batch.update(keluargaRef, { noKK, alamat, kepalaKeluarga: nama });

        if (editingKeluarga.kepalaKeluargaData?.id) {
          const kepalaKeluargaRef = doc(db, "keluarga", editingKeluarga.keluarga.id, "anggota", editingKeluarga.kepalaKeluargaData.id);
          batch.update(kepalaKeluargaRef, { nama, ...anggotaValues });
        } else {
          const anggotaData = { nama, ...anggotaValues, statusHubungan: "Kepala Keluarga" };
          const newAnggotaRef = doc(collection(db, "keluarga", editingKeluarga.keluarga.id, "anggota"));
          batch.set(newAnggotaRef, anggotaData);
        }
        
        await batch.commit();
        toast({ title: "Berhasil", description: "Data keluarga berhasil diperbarui." });
      } else {
        const keluargaData = { noKK, alamat, kepalaKeluarga: nama };
        const anggotaData = { nama, ...anggotaValues, statusHubungan: "Kepala Keluarga" };
        
        const newKeluargaRef = doc(collection(db, "keluarga"));
        const newAnggotaRef = doc(collection(db, "keluarga", newKeluargaRef.id, "anggota"));

        batch.set(newKeluargaRef, keluargaData);
        batch.set(newAnggotaRef, anggotaData);

        await batch.commit();
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
      const anggotaRef = doc(db, "keluarga", keluargaId, "anggota", anggotaId);
      const anggotaSnap = await getDoc(anggotaRef);
      if (anggotaSnap.exists() && anggotaSnap.data().statusHubungan === 'Kepala Keluarga') {
        toast({ variant: "destructive", title: "Aksi Ditolak", description: "Tidak dapat menghapus kepala keluarga. Hapus data keluarga untuk melanjutkan." });
        return;
      }
      await deleteDoc(anggotaRef);
      toast({ title: "Berhasil", description: "Data anggota keluarga berhasil dihapus." });
    } catch (error) {
      console.error("Error deleting anggota: ", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menghapus data." });
    }
  };

  const handleExportData = async () => {
    toast({ title: "Mengekspor data...", description: "Mohon tunggu sebentar." });
    try {
      const keluargaQuery = query(collection(db, "keluarga"));
      const keluargaSnapshot = await getDocs(keluargaQuery);
      
      const flatData: any[] = [];

      for (const keluargaDoc of keluargaSnapshot.docs) {
        const keluargaData = keluargaDoc.data() as Omit<Keluarga, 'id' | 'anggota'>;
        const anggotaColRef = collection(db, "keluarga", keluargaDoc.id, "anggota");
        const anggotaSnapshot = await getDocs(anggotaColRef);

        if (anggotaSnapshot.empty) {
            // Handle case where family has no members
        } else {
            for (const anggotaDoc of anggotaSnapshot.docs) {
                const anggotaData = anggotaDoc.data() as Omit<Anggota, 'id'>;
                flatData.push({
                    noKK: keluargaData.noKK,
                    alamat: keluargaData.alamat,
                    ...anggotaData
                });
            }
        }
      }

      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Warga");
      XLSX.writeFile(workbook, `data_warga_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ title: "Berhasil!", description: "Data warga telah diekspor ke file Excel." });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({ variant: "destructive", title: "Gagal Mengekspor", description: "Terjadi kesalahan saat mengekspor data." });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "noKK", "alamat", "nama", "nik", "jenisKelamin", "tempatLahir", "tanggalLahir", 
      "agama", "pendidikan", "jenisPekerjaan", "statusPerkawinan", 
      "statusHubungan", "kewarganegaraan", "namaAyah", "namaIbu"
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template_import_warga.xlsx");
  };
  
  const handleImportData = async () => {
    if (!importFile) {
        toast({ variant: "destructive", title: "Tidak ada file", description: "Silakan pilih file Excel untuk diimpor." });
        return;
    }
    setIsImporting(true);
    toast({ title: "Mengimpor data...", description: "Proses ini mungkin memakan waktu beberapa saat." });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!jsonData.length) {
          toast({ variant: "destructive", title: "File Kosong", description: "File Excel yang Anda unggah tidak berisi data." });
          setIsImporting(false);
          return;
        }

        const batch = writeBatch(db);
        const families: Record<string, { alamat: string, kepalaKeluarga: string, anggota: any[] }> = {};

        // Group data by noKK
        for (const row of jsonData) {
            const validation = anggotaSchema.merge(z.object({ noKK: z.string(), alamat: z.string() })).safeParse(row);
            if (!validation.success) {
               console.warn("Skipping invalid row:", row, validation.error.flatten().fieldErrors);
               continue; // Skip invalid rows
            }
            const { noKK, alamat, statusHubungan, nama } = validation.data;
            if (!families[noKK]) {
                families[noKK] = { alamat, kepalaKeluarga: '', anggota: [] };
            }
            families[noKK].anggota.push(validation.data);
            if (statusHubungan === 'Kepala Keluarga') {
                families[noKK].kepalaKeluarga = nama;
            }
        }

        // Process each family
        for (const noKK in families) {
            const family = families[noKK];
            if (!family.kepalaKeluarga) {
                console.warn(`Skipping family ${noKK}: Kepala Keluarga not found.`);
                continue;
            }
            
            const q = query(collection(db, "keluarga"), where("noKK", "==", noKK));
            const existingFamilySnap = await getDocs(q);
            
            let keluargaId: string;
            if (existingFamilySnap.empty) {
                const newKeluargaRef = doc(collection(db, "keluarga"));
                batch.set(newKeluargaRef, { noKK, alamat: family.alamat, kepalaKeluarga: family.kepalaKeluarga });
                keluargaId = newKeluargaRef.id;
            } else {
                keluargaId = existingFamilySnap.docs[0].id;
                // Optional: Update existing family data if needed
                // batch.update(existingFamilySnap.docs[0].ref, { alamat: family.alamat, kepalaKeluarga: family.kepalaKeluarga });
            }

            for (const member of family.anggota) {
                const { noKK: _noKK, alamat: _alamat, ...anggotaData } = member;
                const newAnggotaRef = doc(collection(db, "keluarga", keluargaId, "anggota"));
                batch.set(newAnggotaRef, anggotaData);
            }
        }

        await batch.commit();
        toast({ title: "Berhasil!", description: `Data warga berhasil diimpor.` });
        setImportDialogOpen(false);
        setImportFile(null);
      } catch (error) {
        console.error("Error importing data:", error);
        toast({ variant: "destructive", title: "Gagal Mengimpor", description: "Terjadi kesalahan. Pastikan format file benar." });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Gagal Membaca File", description: "Tidak dapat membaca file yang dipilih." });
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(importFile);
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Data Warga</h1>
          <p className="text-sm text-muted-foreground">Kelola data warga berdasarkan Kartu Keluarga.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button onClick={handleExportData} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => handleKeluargaDialogOpen()} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Keluarga
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium">Total Keluarga</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{loading ? <Skeleton className="h-7 w-12"/> : stats.totalKK}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium">Total Warga</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{loading ? <Skeleton className="h-7 w-12"/> : stats.totalWarga}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium">Laki-laki</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{loading ? <Skeleton className="h-7 w-12"/> : stats.lakiLaki}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-xs font-medium">Perempuan</CardTitle>
                <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{loading ? <Skeleton className="h-7 w-12"/> : stats.perempuan}</div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Keluarga</CardTitle>
              <CardDescription>Klik ikon panah untuk melihat anggota keluarga atau gunakan pencarian.</CardDescription>
            </div>
            <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Cari No. KK atau Kepala Keluarga..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <div className="border-t">
         <div className="overflow-x-auto">
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
              ) : filteredKeluargaList.length > 0 ? (
                filteredKeluargaList.map((keluarga) => (
                  <Collapsible asChild key={keluarga.id} open={openCollapsibles[keluarga.id] || false} onOpenChange={() => toggleCollapsible(keluarga.id)}>
                    <TableBody>
                      <TableRow className="bg-muted/20 hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                              {openCollapsibles[keluarga.id] ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
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
                                    <h4 className="font-semibold mb-4">Anggota Keluarga:</h4>
                                    {keluarga.anggota && keluarga.anggota.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {keluarga.anggota.map((anggota) => (
                                            <Card key={anggota.id} className="bg-white shadow-sm flex flex-col">
                                                <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
                                                    <div>
                                                    <CardTitle className="text-base font-semibold">{anggota.nama}</CardTitle>
                                                    <CardDescription className="pt-1">
                                                        <Badge variant={anggota.statusHubungan === 'Kepala Keluarga' ? 'default' : 'outline'}>{anggota.statusHubungan}</Badge>
                                                    </CardDescription>
                                                    </div>
                                                    <AlertDialog>
                                                        <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={anggota.statusHubungan === 'Kepala Keluarga'}>
                                                            <span className="sr-only">Buka menu</span>
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
                                                </CardHeader>
                                                <CardContent className="p-4 pt-2 text-xs flex-grow">
                                                  <div className="grid grid-cols-[max-content,1fr] gap-x-4 gap-y-1">
                                                      <span className="text-muted-foreground">NIK</span><span className="text-foreground font-medium text-right">{anggota.nik}</span>
                                                      <span className="text-muted-foreground">J. Kelamin</span><span className="text-foreground font-medium text-right">{anggota.jenisKelamin}</span>
                                                      <span className="text-muted-foreground">Lahir</span><span className="text-foreground font-medium text-right truncate">{`${anggota.tempatLahir}, ${anggota.tanggalLahir}`}</span>
                                                      <span className="text-muted-foreground">Agama</span><span className="text-foreground font-medium text-right">{anggota.agama}</span>
                                                      <span className="text-muted-foreground">Pendidikan</span><span className="text-foreground font-medium text-right">{anggota.pendidikan}</span>
                                                      <span className="text-muted-foreground">Pekerjaan</span><span className="text-foreground font-medium text-right">{anggota.jenisPekerjaan}</span>
                                                      <span className="text-muted-foreground">Perkawinan</span><span className="text-foreground font-medium text-right">{anggota.statusPerkawinan}</span>
                                                      <span className="text-muted-foreground">Warga Negara</span><span className="text-foreground font-medium text-right">{anggota.kewarganegaraan}</span>
                                                      <span className="text-muted-foreground">Nama Ayah</span><span className="text-foreground font-medium text-right">{anggota.namaAyah}</span>
                                                      <span className="text-muted-foreground">Nama Ibu</span><span className="text-foreground font-medium text-right">{anggota.namaIbu}</span>
                                                  </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                      </div>
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
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        {searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : "Belum ada data keluarga. Silakan tambahkan data baru."}
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
          </Table>
          </div>
        </div>
      </Card>
      
      {/* Dialog for Keluarga Form */}
      <Dialog open={isKeluargaFormOpen} onOpenChange={setKeluargaFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingKeluarga ? "Edit Data Keluarga" : "Tambah Keluarga Baru"}</DialogTitle>
            <DialogDescription>Lengkapi data utama keluarga dan data kepala keluarga di bawah ini.</DialogDescription>
          </DialogHeader>
          <Form {...keluargaForm}>
            <form onSubmit={keluargaForm.handleSubmit(onKeluargaSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                <div className="space-y-2 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Data Keluarga</h3>
                    <FormField control={keluargaForm.control} name="noKK" render={({ field }) => (
                        <FormItem><FormLabel>Nomor Kartu Keluarga (KK)</FormLabel><FormControl><Input placeholder="16 digit nomor KK" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="alamat" render={({ field }) => (
                        <FormItem><FormLabel>Alamat</FormLabel><FormControl><Input placeholder="Contoh: Blok A No. 1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                    <h3 className="font-medium text-lg">Data Kepala Keluarga</h3>
                     <FormField control={keluargaForm.control} name="nama" render={({ field }) => (
                        <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="nik" render={({ field }) => (
                        <FormItem><FormLabel>NIK</FormLabel><FormControl><Input placeholder="16 digit NIK" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="jenisKelamin" render={({ field }) => (
                        <FormItem><FormLabel>Jenis Kelamin</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Laki-laki">Laki-laki</SelectItem><SelectItem value="Perempuan">Perempuan</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={keluargaForm.control} name="tempatLahir" render={({ field }) => (
                            <FormItem><FormLabel>Tempat Lahir</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={keluargaForm.control} name="tanggalLahir" render={({ field }) => (
                        <FormItem><FormLabel>Tanggal Lahir</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={keluargaForm.control} name="agama" render={({ field }) => (
                        <FormItem><FormLabel>Agama</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="pendidikan" render={({ field }) => (
                        <FormItem><FormLabel>Pendidikan Terakhir</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="jenisPekerjaan" render={({ field }) => (
                        <FormItem><FormLabel>Jenis Pekerjaan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="statusPerkawinan" render={({ field }) => (
                        <FormItem><FormLabel>Status Perkawinan</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Belum Kawin">Belum Kawin</SelectItem><SelectItem value="Kawin">Kawin</SelectItem><SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem><SelectItem value="Cerai Mati">Cerai Mati</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="statusHubungan" render={({ field }) => (
                        <FormItem><FormLabel>Status Hubungan Keluarga</FormLabel><FormControl><Input {...field} readOnly className="bg-gray-100" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={keluargaForm.control} name="kewarganegaraan" render={({ field }) => (
                        <FormItem><FormLabel>Kewarganegaraan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={keluargaForm.control} name="namaAyah" render={({ field }) => (
                            <FormItem><FormLabel>Nama Ayah</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={keluargaForm.control} name="namaIbu" render={({ field }) => (
                            <FormItem><FormLabel>Nama Ibu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <DialogFooter className="pt-4 sticky bottom-0 bg-background">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <FormItem><FormLabel>Status Hubungan Keluarga</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Istri">Istri</SelectItem><SelectItem value="Anak">Anak</SelectItem><SelectItem value="Famili Lain">Famili Lain</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={anggotaForm.control} name="kewarganegaraan" render={({ field }) => (
                    <FormItem><FormLabel>Kewarganegaraan</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={anggotaForm.control} name="namaAyah" render={({ field }) => (
                        <FormItem><FormLabel>Nama Ayah</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={anggotaForm.control} name="namaIbu" render={({ field }) => (
                        <FormItem><FormLabel>Nama Ibu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter className="pt-4 sticky bottom-0 bg-background">
                    <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                    <Button type="submit" disabled={anggotaForm.formState.isSubmitting}>
                        {anggotaForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Import */}
      <Dialog open={isImportDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data Warga</DialogTitle>
            <DialogDescription>
              Unggah file Excel untuk menambahkan data warga secara massal. Pastikan format file sesuai dengan template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="excel-file">File Excel</Label>
              <Input 
                id="excel-file" 
                type="file" 
                accept=".xlsx, .xls"
                ref={importFileRef}
                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
            <Button variant="link" size="sm" className="p-0 justify-start h-auto" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Unduh Template Excel
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
            <Button onClick={handleImportData} disabled={isImporting || !importFile}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
