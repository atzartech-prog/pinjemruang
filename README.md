# RuangReserva - Meeting Room Booking System

Sistem Reservasi Ruang Rapat berbasis web statis (HTML, CSS, JS, JSON) yang memanfaatkan `localStorage` untuk menyimpan data pemesanan secara lokal.

## 📂 Struktur Proyek
Proyek ini dibuat langsung di folder Download penyimpanan internal ponsel Anda agar mudah diakses:
- **[index.html](file:///data/data/com.termux/files/home/storage/downloads/peminjamanruang/index.html)**: Struktur halaman utama & modal input.
- **[style.css](file:///data/data/com.termux/files/home/storage/downloads/peminjamanruang/style.css)**: Desain premium bergaya gelap/terang, responsif ponsel, efek kaca (*glassmorphism*), dan animasi mikro.
- **[app.js](file:///data/data/com.termux/files/home/storage/downloads/peminjamanruang/app.js)**: Logika aplikasi, validasi bentrok jadwal (*collision detection*), penentuan status sibuk/tersedia ruangan waktu nyata, serta penyimpanan lokal.
- **[rooms.json](file:///data/data/com.termux/files/home/storage/downloads/peminjamanruang/rooms.json)**: Basis data ruangan awal yang dibaca oleh Javascript.

## 🚀 Cara Menjalankan Aplikasi

Ada beberapa cara untuk membuka aplikasi ini di ponsel Anda:

### Metode A: Membuka Langsung via File Manager
Karena diletakkan di folder **Download** ponsel Anda (`/storage/emulated/0/Download/peminjamanruang`), Anda dapat:
1. Buka aplikasi **File Manager** bawaan ponsel Anda.
2. Navigasikan ke folder **Download** -> **peminjamanruang**.
3. Ketuk file `index.html` dan buka dengan browser favorit Anda (Chrome, Firefox, dll.).
*(Catatan: Kami telah menyertakan mekanisme fallback data tertanam di JS untuk mengatasi batasan CORS browser saat membuka file protokol `file://` langsung).*

### Metode B: Menjalankan Server Lokal dari Termux (Direkomendasikan)
Jika ingin performa maksimal dan akses penuh tanpa kendala CORS browser:
1. Jalankan perintah berikut di Termux untuk memulai server web Python:
   ```bash
   cd /data/data/com.termux/files/home/storage/downloads/peminjamanruang
   python -m http.server 8080
   ```
2. Buka browser di ponsel Anda dan akses alamat:
   ```
   http://localhost:8080
   ```

## ✨ Fitur Utama
1. **Pencegahan Jadwal Bentrok**: Sistem secara otomatis mengecek jadwal yang tumpang tindih untuk ruangan yang sama dan memblokir pengiriman formulir jika terjadi konflik.
2. **Status Ruangan Waktu Nyata**: Menghitung secara dinamis apakah suatu ruangan sedang dipakai (*Sibuk*) atau *Tersedia* berdasarkan waktu sistem saat ini.
3. **Penyimpanan Lokal (localStorage)**: Semua data reservasi disimpan dengan aman di memori browser ponsel Anda, sehingga data tetap ada meskipun halaman disegarkan.
4. **Desain Gelap/Terang Otomatis & Manual**: Mendukung preferensi sistem ponsel dan dapat diganti secara manual melalui tombol toggle di header.
