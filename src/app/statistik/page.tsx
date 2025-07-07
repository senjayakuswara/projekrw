
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, User, UserRound, Home } from "lucide-react";
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";

// Types
type Anggota = { id: string; jenisKelamin: string; [key: string]: any };
type Keluarga = { id: string; anggota?: Anggota[]; [key: string]: any };

const chartConfig = {
    lakiLaki: { label: "Laki-laki", color: "hsl(var(--primary))" },
    perempuan: { label: "Perempuan", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

export default function StatistikPage() {
    const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnggota = useCallback(async (keluargaId: string): Promise<Anggota[]> => {
        const anggotaColRef = collection(db, "keluarga", keluargaId, "anggota");
        const snapshot = await getDocs(anggotaColRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Anggota));
    }, []);

    useEffect(() => {
        setLoading(true);
        const unsubKeluarga = onSnapshot(collection(db, "keluarga"), async (snapshot) => {
            const keluargaDataPromises = snapshot.docs.map(async (doc) => {
                const anggota = await fetchAnggota(doc.id);
                return { id: doc.id, ...doc.data(), anggota } as Keluarga;
            });
            const allKeluargaData = await Promise.all(keluargaDataPromises);
            setKeluargaList(allKeluargaData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setLoading(false);
        });

        return () => unsubKeluarga();
    }, [fetchAnggota]);

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
    
    const genderData = useMemo(() => [
        { name: 'lakiLaki', value: stats.lakiLaki, fill: "var(--color-lakiLaki)" },
        { name: 'perempuan', value: stats.perempuan, fill: "var(--color-perempuan)" },
    ], [stats.lakiLaki, stats.perempuan]);

    const renderStatCard = (title: string, value: number, Icon: React.ElementType, description: string) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-20" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Statistik Kependudukan</h1>
                <p className="text-muted-foreground">Ringkasan data demografi warga Desa Naringgul.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {renderStatCard("Total Kartu Keluarga", stats.totalKK, Home, "Jumlah KK terdaftar")}
                {renderStatCard("Total Warga", stats.totalWarga, Users, "Total seluruh penduduk")}
                {renderStatCard("Laki-laki", stats.lakiLaki, User, "Jumlah penduduk laki-laki")}
                {renderStatCard("Perempuan", stats.perempuan, UserRound, "Jumlah penduduk perempuan")}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribusi Gender</CardTitle>
                        <CardDescription>Perbandingan jumlah penduduk laki-laki dan perempuan.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-[250px] w-full">
                                <Skeleton className="h-[200px] w-[200px] rounded-full" />
                            </div>
                        ) : (
                            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                        <Cell key="cell-lakiLaki" fill={chartConfig.lakiLaki.color} />
                                        <Cell key="cell-perempuan" fill={chartConfig.perempuan.color} />
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                </PieChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Statistik Lainnya</CardTitle>
                        <CardDescription>Segera hadir.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">Belum ada data</p>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
