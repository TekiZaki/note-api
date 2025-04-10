// Import modul yang diperlukan
const express = require("express");
const cors = require("cors");
const fs = require("fs"); // Modul File System bawaan Node.js

// Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 6969;
const DB_FILE = "./notes.json"; // File penyimpanan data

// --- Middleware ---
app.use(cors()); // Mengizinkan request dari domain lain (frontend)
app.use(express.json()); // Mem-parsing body request JSON

// --- Helper Functions untuk Baca/Tulis File JSON ---

// Fungsi untuk membaca data catatan dari file JSON
const readNotes = () => {
  try {
    // Cek jika file tidak ada, buat file kosong dengan array JSON
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2)); // Indentasi 2 spasi
      return []; // Kembalikan array kosong
    }
    // Baca isi file
    const data = fs.readFileSync(DB_FILE, "utf-8");
    // Parse data JSON, jika file kosong atau rusak, kembalikan array kosong
    const parsedData = JSON.parse(data || "[]");
    // Pastikan hasil parse adalah array
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Gagal membaca file notes.json:", error);
    // Jika terjadi error serius saat membaca, coba tulis ulang file dengan array kosong
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    } catch (writeError) {
      console.error(
        "Gagal menulis ulang file notes.json yang rusak:",
        writeError
      );
    }
    return []; // Kembalikan array kosong untuk mencegah crash
  }
};

// Fungsi untuk menulis data catatan ke file JSON
const writeNotes = (notes) => {
  try {
    // Tulis array notes ke file JSON dengan format yang rapi
    fs.writeFileSync(DB_FILE, JSON.stringify(notes, null, 2)); // Indentasi 2 spasi
  } catch (error) {
    console.error("Gagal menulis ke file notes.json:", error);
    // Di aplikasi nyata, mungkin perlu mekanisme notifikasi error yang lebih baik
  }
};

// --- Routes (Endpoint API) ---

// 1. GET /notes – Mengambil seluruh catatan
app.get("/notes", (req, res) => {
  try {
    const notes = readNotes();
    // Mengirim data catatan sebagai response JSON dengan status 200 (OK)
    res.status(200).json(notes);
  } catch (error) {
    // Jika terjadi error, kirim response 500 (Internal Server Error)
    res
      .status(500)
      .json({ message: "Gagal mengambil data catatan", error: error.message });
  }
});

// 2. GET /notes/:id – Mengambil detail catatan berdasarkan ID
app.get("/notes/:id", (req, res) => {
  try {
    const notes = readNotes();
    // Ambil ID dari parameter URL dan konversi ke integer
    const noteId = parseInt(req.params.id, 10);
    // Cari catatan dengan ID yang cocok
    const note = notes.find((n) => n.id === noteId);

    if (note) {
      // Jika catatan ditemukan, kirim sebagai response JSON dengan status 200 (OK)
      res.status(200).json(note);
    } else {
      // Jika tidak ditemukan, kirim response 404 (Not Found)
      res.status(404).json({ message: "Catatan tidak ditemukan" });
    }
  } catch (error) {
    // Jika terjadi error (misal ID tidak valid), kirim response 500
    res.status(500).json({
      message: "Gagal mengambil detail catatan",
      error: error.message,
    });
  }
});

// 3. POST /notes – Menambahkan catatan baru
app.post("/notes", (req, res) => {
  try {
    const notes = readNotes();
    const { judul, isi } = req.body; // Ambil judul dan isi dari body request

    // Validasi input: judul atau isi wajib ada
    if (!judul && !isi) {
      // Memperbolehkan salah satu kosong, tapi tidak keduanya
      return res
        .status(400) // Bad Request
        .json({ message: "Judul atau isi catatan wajib diisi" });
    }

    // Tentukan ID berikutnya (auto-increment sederhana)
    let nextId = 1;
    if (notes.length > 0) {
      // Cari ID numerik tertinggi yang ada, default ke 0 jika tidak ada ID numerik
      const maxId = Math.max(
        0,
        ...notes.map((note) => (typeof note.id === "number" ? note.id : 0))
      );
      nextId = maxId + 1;
    }

    // Buat objek catatan baru
    const newNote = {
      id: nextId, // ID numerik berurutan
      judul: String(judul || "Tanpa Judul"), // Default judul jika kosong
      isi: String(isi || ""), // Default isi jika kosong
      tanggal: new Date().toISOString(), // <-- FULL ISO String for creation timestamp
      tanggalDiubah: null, // Awalnya null
    };

    // Tambahkan catatan baru ke array
    notes.push(newNote);
    // Tulis kembali array notes ke file
    writeNotes(notes);

    // Kirim catatan baru sebagai response JSON dengan status 201 (Created)
    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error saat POST /notes:", error);
    // Jika terjadi error, kirim response 500
    res.status(500).json({
      message: "Gagal menambahkan catatan baru",
      error: error.message,
    });
  }
});

// 4. PUT /notes/:id – Mengedit catatan berdasarkan ID
app.put("/notes/:id", (req, res) => {
  try {
    const notes = readNotes();
    const noteId = parseInt(req.params.id, 10); // Konversi ID ke number
    const { judul, isi } = req.body; // Ambil data baru dari body request
    const noteIndex = notes.findIndex((n) => n.id === noteId); // Cari index catatan

    // Validasi input: judul atau isi wajib ada
    if (!judul && !isi) {
      return res
        .status(400) // Bad Request
        .json({ message: "Judul atau isi catatan wajib diisi" });
    }

    if (noteIndex !== -1) {
      // Jika catatan ditemukan
      const updatedNote = {
        ...notes[noteIndex], // Salin properti lama (termasuk ID dan tanggal dibuat)
        judul: String(judul || "Tanpa Judul"), // Update judul
        isi: String(isi || ""), // Update isi
        tanggalDiubah: new Date().toISOString(), // <-- SET Update Timestamp
      };
      // Ganti catatan lama dengan catatan yang sudah diupdate
      notes[noteIndex] = updatedNote;
      // Tulis kembali array notes ke file
      writeNotes(notes);
      // Kirim catatan yang sudah diupdate sebagai response JSON dengan status 200 (OK)
      res.status(200).json(updatedNote);
    } else {
      // Jika catatan tidak ditemukan, kirim response 404 (Not Found)
      res.status(404).json({ message: "Catatan tidak ditemukan" });
    }
  } catch (error) {
    console.error("Error saat PUT /notes/:id :", error);
    // Jika terjadi error, kirim response 500
    res
      .status(500)
      .json({ message: "Gagal mengedit catatan", error: error.message });
  }
});

// 5. DELETE /notes/:id – Menghapus catatan
app.delete("/notes/:id", (req, res) => {
  try {
    let notes = readNotes();
    const noteId = parseInt(req.params.id, 10); // Konversi ID ke number
    const initialLength = notes.length;

    // Filter array untuk menghapus catatan dengan ID yang cocok
    notes = notes.filter((n) => n.id !== noteId);

    if (notes.length < initialLength) {
      // Jika panjang array berkurang (berarti ada yang dihapus)
      writeNotes(notes); // Tulis kembali array yang sudah difilter
      // Kirim response 204 (No Content) yang menandakan sukses tanpa body response
      res.status(204).send();
    } else {
      // Jika tidak ada yang dihapus (ID tidak ditemukan), kirim response 404
      res.status(404).json({ message: "Catatan tidak ditemukan" });
    }
  } catch (error) {
    console.error("Error saat DELETE /notes/:id :", error);
    // Jika terjadi error, kirim response 500
    res
      .status(500)
      .json({ message: "Gagal menghapus catatan", error: error.message });
  }
});

// --- Jalankan Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server API catatan berjalan di http://localhost:${PORT}`);
  // Cek atau buat file DB saat start
  readNotes();
  console.log(`💾 Menggunakan file database: ${DB_FILE}`);
});
