'use client';

import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Newspaper, Users, Wallet } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { BottomNav } from '@/components/ui/bottom-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <SidebarProvider>
      <div className="hidden md:flex md:flex-col md:h-full">
        <Sidebar>
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                    <Image src="/icons/icon-192x192.png" alt="Logo RW" width={40} height={40} className="rounded-full" />
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold">RW CEKATAN</h2>
                        <p className="text-sm text-muted-foreground">Desa Naringgul</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/welcome')} isActive={pathname === '/welcome'}>
                    <Home />
                    Dashboard
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/data-warga')} isActive={pathname === '/data-warga'}>
                    <Users />
                    Data Warga
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton>
                    <Wallet />
                    Keuangan
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton>
                    <Newspaper />
                    Pengumuman
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            </SidebarContent>
            <div className="mt-auto p-4">
            <Button onClick={handleLogout} variant="outline" className="w-full justify-start gap-2">
                    <LogOut />
                    <span>Logout</span>
                </Button>
            </div>
        </Sidebar>
      </div>
      <SidebarInset>
        <header className="flex h-14 items-center justify-center bg-black/75 px-4 md:justify-end">
            <div className="flex items-center gap-3 md:hidden">
              <Image src="/icons/icon-192x192.png" alt="Logo RW" width={32} height={32} className="rounded-md" />
              <h1 className="text-lg font-bold text-white">RW CEKATAN</h1>
            </div>
            <p className="hidden font-semibold text-sm text-white md:block">adminrw@naringgul.com</p>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}
