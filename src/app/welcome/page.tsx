
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Wallet, Calendar, Megaphone } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan informasi aplikasi RW Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Warga
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">
              +20.1% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saldo Kas RW
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 5.432.100</div>
            <p className="text-xs text-muted-foreground">
              +15.5% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surat Diajukan</CardTitle>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="h-4 w-4 text-muted-foreground" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1zM6 4h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1m0 2h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1m0 2h2a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1"/>
                </svg>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Perlu diproses</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kegiatan Aktif
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2</div>
            <p className="text-xs text-muted-foreground">
              Dalam minggu ini
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Pengumuman Terbaru</CardTitle>
            <CardDescription>
              Informasi penting untuk warga.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-md">
                    <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <p className="font-medium">Kerja Bakti Bulanan</p>
                    <p className="text-sm text-muted-foreground">Diharapkan kehadiran seluruh warga pada hari Minggu, 28 Juli 2024 pukul 07:00.</p>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-md">
                    <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <p className="font-medium">Pembayaran Iuran Keamanan</p>
                    <p className="text-sm text-muted-foreground">Batas akhir pembayaran iuran keamanan bulan Juli adalah tanggal 31 Juli 2024.</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Jadwal Kegiatan</CardTitle>
             <CardDescription>
              Kegiatan yang akan datang di lingkungan RW.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-2 rounded-md">
                    <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                    <p className="font-medium">Posyandu Balita</p>
                    <p className="text-sm text-muted-foreground">Selasa, 30 Juli 2024 - 09:00 WIB</p>
                </div>
             </div>
             <div className="flex items-start gap-4">
                 <div className="bg-accent/10 p-2 rounded-md">
                    <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                    <p className="font-medium">Rapat Karang Taruna</p>
                    <p className="text-sm text-muted-foreground">Rabu, 31 Juli 2024 - 19:30 WIB</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
