
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Warga = {
  id: string;
  nama: string;
  noKK: string;
  alamat: string;
  status: "Tetap" | "Kontrak";
};

const dataWarga: Warga[] = [
  { id: "1", nama: "Budi Santoso", noKK: "320301xxxxxxxx01", alamat: "Blok A No. 1", status: "Tetap" },
  { id: "2", nama: "Ani Suryani", noKK: "320301xxxxxxxx02", alamat: "Blok A No. 2", status: "Tetap" },
  { id: "3", nama: "Candra Wijaya", noKK: "320301xxxxxxxx03", alamat: "Blok B No. 1", status: "Kontrak" },
  { id: "4", nama: "Dewi Lestari", noKK: "320301xxxxxxxx04", alamat: "Blok C No. 5", status: "Tetap" },
  { id: "5", nama: "Eko Prasetyo", noKK: "320301xxxxxxxx05", alamat: "Blok C No. 8", status: "Kontrak" },
];


export default function DataWargaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Warga</h1>
            <p className="text-muted-foreground">Kelola data warga di lingkungan Anda.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Warga
        </Button>
      </div>

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
              {dataWarga.map((warga) => (
                <TableRow key={warga.id}>
                  <TableCell className="font-medium">{warga.nama}</TableCell>
                  <TableCell>{warga.noKK}</TableCell>
                  <TableCell>{warga.alamat}</TableCell>
                  <TableCell>
                    <Badge variant={warga.status === 'Tetap' ? 'default' : 'secondary'}>{warga.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
