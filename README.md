# SVG Prep Studio

Website statis untuk menyiapkan file SVG sebelum upload ke **Adobe Stock** dan **Canva** (juga berguna untuk Freepik, Vecteezy, dll).

## Fitur
- Pilih platform Canva atau Adobe Stock, ketentuan dan checklist menyesuaikan
- Artboard: Canva 500 px (terkunci), Adobe Stock 1000–4800 px
- Stroke otomatis diubah menjadi shape/fill (Paper.js + Clipper)
- Metadata tertanam di SVG: judul, creator, tanggal upload, hak cipta/lisensi, keyword (minimal 10, otomatis)
- Ubah warna ikon (per warna atau satu warna untuk semua)
- Unduh hasil akhir sebagai `.svg`; preview JPG 500×500 untuk Canva

Semua proses berjalan di browser, file tidak diunggah ke server mana pun.

## Struktur
```
index.html
css/style.css
js/app.js
.github/workflows/pages.yml
```

## Deploy ke GitHub Pages
1. Buat repository baru di GitHub (mis. `svg-prep-studio`), lalu push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<username>/svg-prep-studio.git
   git push -u origin main
   ```
2. Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Workflow `pages.yml` jalan otomatis setiap push ke `main`. Situs tersedia di `https://<username>.github.io/svg-prep-studio/`.

Alternatif tanpa Actions: Source = *Deploy from a branch* → `main` → `/ (root)`.

## Menjalankan lokal
Buka `index.html` di browser, atau jalankan `python3 -m http.server 8000` lalu buka http://localhost:8000.
Butuh internet untuk memuat Paper.js dan Clipper dari cdnjs.

## Catatan
- Teks hidup tidak bisa di-outline otomatis; outline dulu di Illustrator.
- Gradient tidak bisa diubah warnanya; pola stroke putus-putus tidak dikonversi.
- Tombol "Keyword AI" hanya muncul di lingkungan Claude; di GitHub Pages dipakai keyword otomatis lokal (dari judul / nama file, bisa diedit).
- Aturan platform bisa berubah, cek halaman resmi sebelum upload batch besar.

## Lisensi
MIT
