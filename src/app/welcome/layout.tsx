
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
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
                    <Image src="https://placehold.co/40x40.png" alt="Logo RW" width={40} height={40} className="rounded-full" data-ai-hint="logo building" />
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold">Aplikasi RW</h2>
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
        <header className="flex h-14 items-center justify-end border-b bg-background px-4">
            <p className="font-semibold text-sm">adminrw@naringgul.com</p>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}
