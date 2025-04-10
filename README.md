# 📘 Dokumentasi `server.js` – Aplikasi Catatan Sederhana

## 📝 Deskripsi

API Catatan adalah sistem pengelolaan catatan sederhana yang menyimpan data dalam format JSON. API ini memungkinkan pengguna untuk membuat, membaca, memperbarui, dan menghapus catatan (CRUD operations).

### 🛠 Teknologi yang Digunakan

- **Node.js** dengan **Express** sebagai server backend.
- **File JSON** (`notes.json`) sebagai basis data lokal.
- **CORS** diaktifkan agar dapat diakses dari frontend.
- **Port Default**: 6969
- **Format Data**: JSON

---

## 🚀 Cara Kerja Singkat

- File ini membuat REST API sederhana untuk CRUD catatan.
- Catatan disimpan di file `notes.json`.
- ID catatan berupa angka yang bertambah otomatis.
- Format catatan:
  ```json
  {
    "id": 1,
    "judul": "Judul Catatan",
    "isi": "Isi catatan...",
    "tanggal": "2025-04-10T14:20:00.000Z",
    "tanggalDiubah": null
  }
  ```

---

## 🔧 Fungsi Utama

| Fungsi         | Deskripsi                                                                      |
| -------------- | ------------------------------------------------------------------------------ |
| `readNotes()`  | Membaca catatan dari file JSON. Jika tidak ada file, akan membuat file kosong. |
| `writeNotes()` | Menyimpan array catatan ke file JSON dengan format rapi.                       |

---

## 🔁 Endpoint API

| Method | Endpoint     | Deskripsi                        |
| ------ | ------------ | -------------------------------- |
| GET    | `/notes`     | Mengambil semua catatan          |
| GET    | `/notes/:id` | Mengambil catatan berdasarkan ID |
| POST   | `/notes`     | Menambahkan catatan baru         |
| PUT    | `/notes/:id` | Mengedit catatan berdasarkan ID  |
| DELETE | `/notes/:id` | Menghapus catatan berdasarkan ID |

---

## 📁 Struktur File

- `server.js` – Server Express dengan semua route API.
- `notes.json` – Tempat menyimpan data catatan.
- `tutorial.md` – Panduan penggunaan API (lihat di bawah).

---

## 🛠️ Panduan Instalasi

1. Pastikan Node.js terinstal pada sistem Anda.
2. Kloning atau download repositori.
3. Buka terminal dan navigasi ke direktori proyek.
4. Instal dependensi:

   ```bash
   npm install
   ```

5. Jalankan server:

   ```bash
   node server.js
   ```

6. Server akan berjalan di `http://localhost:6969`.

---

## ⚠️ Penanganan Error

- `400 Bad Request`: Terjadi ketika request tidak valid (misalnya judul dan isi keduanya kosong).
- `404 Not Found`: Terjadi ketika catatan dengan ID yang diminta tidak ditemukan.
- `500 Internal Server Error`: Terjadi ketika ada masalah server (misalnya kesalahan saat menulis file).

---

## 📄 Panduan Penggunaan API

Selamat datang di Panduan Aplikasi Catatan. Ini adalah panduan singkat tentang cara menggunakan aplikasi ini.

### 1. Mendapatkan Semua Catatan:

```
GET http://localhost:6969/notes
```

- **Response**: Array berisi semua catatan.
- **Status Kode**: 200 (OK), 500 (Error Server).

Atau mendapatkan catatan berdasarkan ID tertentu:

```
GET http://localhost:6969/notes/:id
```

- **Parameter**: `id` - ID catatan yang ingin diambil, contohnya `1`.
- **Response**: Objek catatan atau pesan error.
- **Status Kode**: 200 (OK), 404 (Tidak Ditemukan), 500 (Error Server).

### 2. Membuat Catatan Baru:

```
POST http://localhost:6969/notes
```

- **Body (raw JSON)**:

  ```json
  {
    "judul": "Catatan Pertama",
    "isi": "Ini adalah isi dari catatan pertama saya."
  }
  ```

- **Catatan**: Salah satu dari `judul` atau `isi` wajib diisi.
- **Response**: Objek catatan baru yang dibuat.
- **Status Kode**: 201 (Dibuat), 400 (Bad Request), 500 (Error Server).

### 3. Memperbarui Catatan:

```
PUT http://localhost:6969/notes/:id
```

- **Body (raw JSON)**:

  ```json
  {
    "judul": "Catatan Pertama (Updated)",
    "isi": "Isinya sudah diperbarui."
  }
  ```

### 4. Menghapus Catatan:

```
DELETE http://localhost:6969/notes/:id
```

---

## 📝 Catatan

- API ini menggunakan file JSON sebagai database sederhana, sehingga tidak cocok untuk aplikasi dengan beban tinggi.
- Tidak ada mekanisme autentikasi, sehingga setiap orang dengan akses ke server dapat mengakses dan memodifikasi catatan.
- `ID` menggunakan sistem auto-increment sederhana.
