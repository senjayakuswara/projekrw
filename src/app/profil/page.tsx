
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';

export default function ProfilPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState('Admin RW');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Logic to change password only if new password fields are filled
    if (newPassword) {
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
      
      // Simulate checking old password
      if (oldPassword !== 'adminrw123456') {
          toast({
              variant: "destructive",
              title: "Gagal",
              description: "Password lama salah.",
          });
          setIsLoading(false);
          return;
      }
    }

    // Simulation of saving data
    setTimeout(() => {
        toast({
            title: "Berhasil",
            description: "Profil berhasil diperbarui. (Simulasi)",
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // In a real app, you would also save the new username
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
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>
              Perbarui nama pengguna Anda. Email tidak dapat diubah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nama Pengguna</Label>
              <Input 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value="adminrw@naringgul.com" disabled />
            </div>
          </CardContent>
          
          <Separator className="my-4" />

          <CardHeader>
            <CardTitle>Ubah Password</CardTitle>
            <CardDescription>
                Kosongkan bagian ini jika Anda tidak ingin mengubah password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Password Lama</Label>
              <Input 
                id="oldPassword" 
                type="password" 
                required={!!newPassword}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
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
