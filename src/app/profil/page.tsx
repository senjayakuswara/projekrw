"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ProfilPage() {
  const { toast } = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Password baru dan konfirmasi password tidak cocok.",
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Password baru minimal harus 6 karakter.",
        });
        setIsLoading(false);
        return;
    }

    // Since login is hardcoded, this is just a simulation.
    // In a real app, you would call an API to change the password.
    setTimeout(() => {
        if (oldPassword === 'adminrw123456') {
             toast({
                title: "Berhasil",
                description: "Password berhasil diubah. (Simulasi)",
             });
             setOldPassword('');
             setNewPassword('');
             setConfirmPassword('');
        } else {
            toast({
                variant: "destructive",
                title: "Gagal",
                description: "Password lama salah.",
            });
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Profil</h1>
        <p className="text-muted-foreground">Ubah informasi akun dan password Anda.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
          <CardDescription>
            Masukkan password lama dan password baru Anda di bawah ini.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value="adminrw@naringgul.com" disabled />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Password Lama</Label>
              <Input 
                id="oldPassword" 
                type="password" 
                required 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input 
                id="newPassword" 
                type="password" 
                required 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
