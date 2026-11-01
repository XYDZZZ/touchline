# ⚽ Touchline — Manajer Turnamen eFootball & Catatan Laga

Aplikasi web untuk mengelola turnamen eFootball/FIFA (mode **Cup** dengan bracket otomatis & mode **Liga** dengan jadwal + klasemen otomatis), plus mencatat laga pribadi beserta taktik dan evaluasi.

Dibuat dengan: **Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Prisma + SQLite**

---

## 1. Prasyarat (sekali saja)

1. **Install Node.js versi 20 atau lebih baru**
   - Unduh di https://nodejs.org → pilih versi **LTS**
   - Install seperti aplikasi biasa (klik Next sampai selesai)
2. **Cek instalasi** — buka Terminal (Mac/Linux) atau CMD/PowerShell (Windows), ketik:

```bash
node -v
```

Jika muncul angka `v20.x.x` atau lebih baru, siap lanjut.

---

## 2. Menjalankan Aplikasi (3 langkah)

Buka folder hasil ekstrak zip ini di Terminal:

- **Windows**: buka folder di File Explorer → klik address bar → ketik `cmd` → Enter
- **Mac**: klik kanan folder → Services → New Terminal at Folder
- **Linux**: Ctrl+Alt+T lalu `cd` ke folder

Lalu jalankan satu per satu:

```bash
# 1) Pasang semua dependensi (butuh internet, hanya sekali)
npm install

# 2) Siapkan database lokal
npx prisma db push

# 3) Jalankan aplikasi
npm run dev
```

Buka browser ke **http://localhost:3000** — selesai! 🎉

---

## 3. Akun Demo (opsional)

Di dalam paket sudah ada database contoh (`db/custom.db`) berisi akun:

| | |
|---|---|
| Email | `dika@touchline.dev` |
| Kata sandi | `cupwinner123` |

Isinya: 1 turnamen Cup yang sudah selesai (Friday Night Cup), 1 Liga yang sedang berjalan, dan 1 catatan laga. Silakan buat akun sendiri juga lewat tab **Daftar**.

---

## 4. Mulai dari Nol (data kosong)

Hapus file `db/custom.db`, lalu jalankan ulang:

```bash
npx prisma db push
npm run dev
```

Lalu daftar akun baru lewat tab **Daftar**.

---

## 5. Fitur Utama

- 🔍 **54 tim** (klub top Eropa + timnas) dengan logo — cari lewat kolom pencarian
- 🏆 **Cup**: bracket gugur otomatis (BYE kalau jumlah tim bukan kelipatan 2), skor diinput → pemenang naik sendiri ke babak berikutnya
- 📊 **Liga**: jadwal home & away dibuat otomatis + klasemen langsung dihitung (Poin → Selisih Gol → Gol)
- 📝 **Catatan Laga**: skor, formasi, gaya main, evaluasi + statistik W/D/L
- 🤖 **Ekspor JSON untuk AI**: satu klik untuk mengekspor seluruh riwayat laga (siap ditempel ke ChatGPT/Claude untuk dianalisis)
- 📱 Tampilan rapi di HP dan desktop

---

## 6. Masalah Umum (Troubleshooting)

| Masalah | Solusi |
|---|---|
| `node bukan perintah internal` (Windows) | Node.js belum terpasang / terminal perlu ditutup dan dibuka ulang setelah install |
| Port 3000 sudah dipakai | Jalankan `npm run dev -- -p 3001` lalu buka http://localhost:3001 |
| Error Prisma saat install | Jalankan `npx prisma generate` lalu `npm run dev` lagi |
| Logo klub tidak muncul | Logo dimuat dari Wikipedia — pastikan terhubung internet. Kalau gagal, otomatis diganti inisial tim |
| `npm install` lambat/gagal | Coba ganti jaringan, atau jalankan ulang perintahnya (npm bisa lanjut dari posisi berhenti) |

---

## 7. Struktur Proyek (singkat)

```
touchline/
├── src/
│   ├── app/            # Halaman & API
│   ├── components/     # Komponen UI (bracket, klasemen, form, dll)
│   ├── data/           # 54 tim + logo (teams.json)
│   └── lib/            # Logika: engine bracket, klasemen, auth, database
├── prisma/schema.prisma  # Skema database (PostgreSQL / Supabase)
└── package.json
```

---

## 8. Deploy ke Vercel (Online)

1. **Siapkan Database PostgreSQL Gratis**:
   - Buat project di [Supabase](https://supabase.com) atau [Neon.tech](https://neon.tech).
   - Salin **Connection String (URI)** database Anda.
2. **Push Skema Database ke Cloud**:
   - Atur sementara `DATABASE_URL` di file `.env` dengan URI PostgreSQL Anda.
   - Jalankan `npm run db:push` untuk membuat semua tabel otomatis.
3. **Hubungkan ke Vercel**:
   - Buka dashboard [Vercel](https://vercel.com) -> **Add New Project**.
   - Import repository GitHub ini (`XYDZZZ/touchline`).
   - Di bagian **Environment Variables**, tambahkan:
     - `DATABASE_URL` = *Connection String PostgreSQL Anda*
   - Klik **Deploy**. Selesai!

