
'use client';

import { Home, Newspaper, Users, Wallet, MoreHorizontal, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { href: '/welcome', label: 'Dashboard', icon: Home },
  { href: '/data-warga', label: 'Data Warga', icon: Users },
  { href: '/keuangan', label: 'Keuangan', icon: Wallet },
  { href: '/pengumuman', label: 'Pengumuman', icon: Newspaper },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex flex-col items-center justify-center px-2 text-center hover:bg-gray-50 dark:hover:bg-gray-800 group',
              pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
        <Sheet>
            <SheetTrigger asChild>
                <button type="button" className="inline-flex flex-col items-center justify-center px-2 text-center hover:bg-gray-50 dark:hover:bg-gray-800 group text-muted-foreground">
                    <MoreHorizontal className="w-5 h-5 mb-1" />
                    <span className="text-xs">Lainnya</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                <SheetHeader className="text-left mb-2">
                    <SheetTitle>Menu Lainnya</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 p-2">
                    <div className="font-semibold text-sm p-2 rounded-md bg-muted">adminrw@naringgul.com</div>
                    <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
