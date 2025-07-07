
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Wallet, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";

const menuItems = [
  {
    title: "Data Warga",
    description: "Kelola data kependudukan",
    icon: Users,
    href: "/data-warga",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Keuangan",
    description: "Catat pemasukan & pengeluaran",
    icon: Wallet,
    href: "/keuangan",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Pengumuman",
    description: "Buat & lihat informasi penting",
    icon: Newspaper,
    href: "/pengumuman",
    color: "bg-yellow-100 text-yellow-600",
  },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Aplikasi RW CEKATAN.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {menuItems.map((item) => (
          <Card 
            key={item.href} 
            className="group cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
            onClick={() => router.push(item.href)}
          >
            <CardHeader className="p-4 items-center text-center">
              <div className={`p-4 rounded-full ${item.color} mb-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}>
                <item.icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-center">
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
