"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import type { User } from 'firebase/auth';

export default function ProfilPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUsername(currentUser.displayName || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      // Update display name if changed
      if (username !== user.displayName) {
        await updateProfile(user, { displayName: username });
        localStorage.setItem('rw_cekatan_username', username);
        toast({ title: "Berhasil", description: "Nama pengguna berhasil diperbarui." });
      }

      // Update password if new password is provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({ variant: "destructive", title: "Gagal", description: "Password baru dan konfirmasi tidak cocok." });
          return;
        }
        if (newPassword.length < 6) {
          toast({ variant: "destructive", title: "Gagal", description: "Password baru minimal harus 6 karakter." });
          return;
        }
        
        // Re-authenticate user before changing password
        if (user.email && oldPassword) {
          const credential = EmailAuthProvider.credential(user.email, oldPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
          
          toast({ title: "Berhasil", description: "Password berhasil diubah." });
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
           toast({ variant: "destructive", title: "Gagal", description: "Password lama diperlukan untuk mengubah password." });
        }
      }
    } catch (error: any) {
        console.error("Profile update error:", error);
        if (error.code === 'auth/wrong-password') {
            toast({ variant: "destructive", title: "Gagal", description: "Password lama salah." });
        } else {
            toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat memperbarui profil." });
        }
    } finally {
        setIsLoading(false);
    }
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
              <Input id="email" type="email" value={user?.email || ''} disabled />
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
                required={!!newPassword}
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
