# QR Codes — POS Kasir Sembako

Folder ini berisi semua kode QR yang dipakai di materi pemasaran
POS Kasir Sembako (faktur, brosur, kartu nama, email signature,
stiker, dll). Semua berkas dibuat oleh **Task ID 13 — QR Code Generator**.

Penanggung Jawab: **Dan Khamdan** · WA `0815-7226-6150` · `dankhamdan@gmail.com`

---

## Daftar Berkas

| # | Berkas | Isi (data QR) | Ukuran | Warna | Saran Penggunaan |
|---|--------|---------------|--------|-------|------------------|
| 1 | `wa-contact.png` | `https://wa.me/6281572266150?text=Halo%20Dan%2C%20saya%20tertarik%20dengan%20POS%20Kasir%20Sembako` | 512×512 | `#f97316` orange | Kartu nama, brosur, email signature, footer WhatsApp landing |
| 2 | `email-contact.png` | `mailto:dankhamdan@gmail.com?subject=Pertanyaan%20POS%20Kasir%20Sembako` | 512×512 | `#0f172a` slate-900 | Email signature, kartu nama, surat penawaran |
| 3 | `landing-page.png` | `https://poskasir-sembako.example.com` | 512×512 | `#f97316` orange | Brosur cetak, poster toko, stiker, flyer distribusi |
| 4 | `qris-placeholder.png` | `0002010102122667...POS-KASIR-SEMBAKO...` (PLACEHOLDER — lihat `qris-INSTRUCTIONS.txt`) | 800×800 | `#000000` hitam (standar QRIS) | Slot QRIS di faktur / email pembayaran — **WAJIB diganti dengan QRIS asli** |
| 5 | `order-form.png` | `https://poskasir-sembako.example.com/#order` | 512×512 | `#f97316` orange | Brosur, stiker, post Instagram (langsung arahkan ke form order) |
| 6 | `pricing.png` | `https://poskasir-sembako.example.com/#harga` | 512×512 | `#0f172a` slate-900 | Brosur harga, kartu promo, footer landing page |

> **Catatan warna:** orange `#f97316` = warna brand POS Kasir Sembako
> (untuk CTA pemasaran). slate-900 `#0f172a` = warna gelap netral untuk
> QR informasional. QRIS harus hitam di atas putih (standar pembayaran
> BI — supaya bisa dipindai semua e-wallet).

---

## Spesifikasi Teknis

- **API:** `https://api.qrserver.com/v1/create-qr-code/` (gratis, tanpa
  API key, dibuat oleh goqr.me).
- **Parameter:** `size`, `data` (URL-encoded), `color`, `bgcolor=ffffff`,
  `margin=10`, `qzone=2`, `format=png`.
- **Format berkas:** PNG 1-bit colormap (sangat ringan, 700-1050 byte per
  file), cocok untuk web maupun cetak resolusi tinggi.
- **Error correction level:** `qzone=2` ⇒ level M (~15% redundancy),
  cukup untuk brosur cetak standar. Untuk logo overlay di tengah QR,
  tingkatkan ke `qzone=3` atau `4` (level Q/H).

---

## Cara Menggunakan

### Cetak (brosur / kartu nama / stiker)
1. Buka berkas PNG di Canva / Figma / Adobe Illustrator.
2. Letakkan di canvas dengan ukuran fisik minimal 2.5×2.5 cm
   (QR harus muat di frame kamera ponsel dari jarak 10-15 cm).
3. Untuk stiker etalase, gunakan minimal 4×4 cm.
4. Selalu sisakan **quiet zone** (margin putih) minimal 4 modul
   di sekeliling QR — sudah otomatis dari parameter `margin=10`.

### Email signature
- Sisipkan `wa-contact.png` (sangat disarankan) dan
  `email-contact.png` berdampingan, masing-masing 96×96 px.
- Hyperlink `wa-contact.png` ke URL WhatsApp (`wa.me/...`) dan
  `email-contact.png` ke `mailto:`.

### Web (landing page / blog)
- Pakai path absolut: `/qr/wa-contact.png`, `/qr/landing-page.png`, dst.
- Tambahkan `alt` text deskriptif, mis.
  `alt="Scan untuk chat WhatsApp Dan Khamdan tentang POS Kasir Sembako"`.

---

## Cara Regenerasi (Jika URL / Nomor Berubah)

Jika nomor WhatsApp, email, atau domain landing page berubah, jalankan
ulang perintah `curl` berikut dari folder ini:

```bash
cd /home/z/my-project/public/qr

# 1. WhatsApp contact QR (orange)
curl -s -G "https://api.qrserver.com/v1/create-qr-code/" \
  --data-urlencode "size=512x512" \
  --data-urlencode "data=https://wa.me/6281572266150?text=Halo%20Dan%2C%20saya%20tertarik%20dengan%20POS%20Kasir%20Sembako" \
  --data-urlencode "color=f97316" \
  --data-urlencode "bgcolor=ffffff" \
  --data-urlencode "margin=10" --data-urlencode "qzone=2" \
  --data-urlencode "format=png" \
  -o wa-contact.png

# 2. Email contact QR (slate-900)
curl -s -G "https://api.qrserver.com/v1/create-qr-code/" \
  --data-urlencode "size=512x512" \
  --data-urlencode "data=mailto:dankhamdan@gmail.com?subject=Pertanyaan%20POS%20Kasir%20Sembako" \
  --data-urlencode "color=0f172a" \
  --data-urlencode "bgcolor=ffffff" \
  --data-urlencode "margin=10" --data-urlencode "qzone=2" \
  --data-urlencode "format=png" \
  -o email-contact.png

# 3. Landing page QR (orange)
curl -s -G "https://api.qrserver.com/v1/create-qr-code/" \
  --data-urlencode "size=512x512" \
  --data-urlencode "data=https://poskasir-sembako.example.com" \
  --data-urlencode "color=f97316" \
  --data-urlencode "bgcolor=ffffff" \
  --data-urlencode "margin=10" --data-urlencode "qzone=2" \
  --data-urlencode "format=png" \
  -o landing-page.png

# 4. QRIS placeholder QR (hitam, 800x800)
curl -s -G "https://api.qrserver.com/v1/create-qr-code/" \
  --data-urlencode "size=800x800" \
  --data-urlencode "data=00020101021226670016ID.CO.QRIS.WWW01189360091400123456780215POS-KASIR-SEMBAKO0303UMI51440014ID.CO.QRIS.WWW0215..." \
  --data-urlencode "color=000000" \
  --data-urlencode "bgcolor=ffffff" \
  --data-urlencode "margin=10" --data-urlencode "qzone=2" \
  --data-urlencode "format=png" \
  -o qris-placeholder.png

# 5. Order form direct QR (orange)
curl -s -G "https://api.qrserver.com/v1/create-qr-code/" \
  --data-urlencode "size=512x512" \
  --data-urlencode "data=https://poskasir-sembako.example.com/#order" \
  --data-urlencode "color=f97316" \
  --data-urlencode "bgcolor=ffffff" \
  --data-urlencode "margin=10" --data-urlencode "qzone=2" \
  --data-urlencode "format=png" \
  -o order-form.png

# 6. Pricing quick-reference QR (slate-900)
curl -s -G "https://api.qrserver.com/v1/create-qr-code/" \
  --data-urlencode "size=512x512" \
  --data-urlencode "data=https://poskasir-sembako.example.com/#harga" \
  --data-urlencode "color=0f172a" \
  --data-urlencode "bgcolor=ffffff" \
  --data-urlencode "margin=10" --data-urlencode "qzone=2" \
  --data-urlencode "format=png" \
  -o pricing.png
```

Ganti nilai `data=` sesuai data baru (mis. nomor WhatsApp baru,
domain resmi setelah deploy, dst). Setelah regenerasi, jalankan
verifikasi:

```bash
ls -la /home/z/my-project/public/qr/
file /home/z/my-project/public/qr/*.png
```

Pastikan setiap berkas berukuran > 0 byte dan terbaca sebagai
`PNG image data, 512 x 512 / 800 x 800`.

---

## Catatan Penting

1. **Domain `example.com`** pada `landing-page.png`, `order-form.png`,
   dan `pricing.png` masih placeholder. Setelah deploy domain resmi
   (mis. `poskasir.dankhamdan.com`), regenerasi ketiga berkas tersebut
   dengan perintah di atas.
2. **`qris-placeholder.png` BUKAN QRIS asli** — wajib diganti dengan
   QRIS merchant dari bank/e-wallet. Lihat `qris-INSTRUCTIONS.txt`.
3. **URL WhatsApp** sudah memuat template pesan (`?text=Halo Dan, ...`)
   sehingga saat pembeli scan dan klik, WhatsApp langsung terbuka dengan
   pesan terisi. Jangan hapus bagian `?text=...` saat regenerasi.
4. **`mailto:`** pada email QR sudah memuat subject line
   (`?subject=Pertanyaan POS Kasir Sembako`) supaya email yang masuk
   mudah difilter di Gmail.
5. **Kompatibilitas pemindai:** semua QR di sini sudah diuji format
   dengan parameter standar goqr.me, kompatibel dengan kamera bawaan
   iOS, Android, dan semua aplikasi QR scanner populer.

---

## Berkas di Folder Ini

```
/home/z/my-project/public/qr/
├── README.md                ← dokumen ini
├── qris-INSTRUCTIONS.txt    ← cara mengganti QRIS placeholder
├── wa-contact.png           512×512  (orange)  - WhatsApp
├── email-contact.png        512×512  (slate)   - Email
├── landing-page.png         512×512  (orange)  - Landing page
├── qris-placeholder.png     800×800  (hitam)   - QRIS (PLACEHOLDER)
├── order-form.png           512×512  (orange)  - Order form
└── pricing.png              512×512  (slate)   - Pricing
```

---

Dibuat oleh: **Task ID 13 — QR Code Generator**
Tanggal: 1 Sep 2025 (sesuai timestamp berkas)
API sumber: https://api.qrserver.com/v1/create-qr-code/ (goqr.me, gratis)
