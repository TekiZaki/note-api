// Import modul yang diperlukan
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 6969;
const DB_FILE = path.join(__dirname, "notes.json"); // Path untuk file database

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Helper Functions untuk Baca/Tulis File JSON Asinkronus ---

/**
 * Memastikan file database ada. Jika tidak, buat file baru dengan array kosong.
 */
async function ensureDBFile() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Membaca data catatan dari file JSON.
 * @returns {Promise<Array>} Array catatan atau array kosong jika terjadi error.
 */
async function readNotes() {
  try {
    await ensureDBFile();
    const data = await fs.readFile(DB_FILE, "utf-8");
    const parsedData = JSON.parse(data || "[]");
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Gagal membaca file notes.json:", error);
    // Lakukan inisialisasi ulang file jika terjadi error
    try {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
    } catch (writeError) {
      console.error(
        "Gagal menulis ulang file notes.json yang rusak:",
        writeError
      );
    }
    return [];
  }
}

/**
 * Menulis data catatan ke file JSON.
 * @param {Array} notes Array catatan yang akan ditulis ke file.
 */
async function writeNotes(notes) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(notes, null, 2));
  } catch (error) {
    console.error("Gagal menulis ke file notes.json:", error);
  }
}

/**
 * Menghasilkan ID baru untuk catatan baru berdasarkan catatan yang sudah ada.
 * @returns {Promise<number>} ID baru
 */
async function generateNewId() {
  const notes = await readNotes();
  const numericIds = notes
    .map((note) => note.id)
    .filter((id) => typeof id === "number");
  return numericIds.length ? Math.max(...numericIds) + 1 : 1;
}

// --- Routes (Endpoint API) ---

// 1. GET /notes – Mengambil seluruh catatan
app.get("/notes", async (req, res) => {
  try {
    const notes = await readNotes();
    res.status(200).json(notes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data catatan", error: error.message });
  }
});

// 2. GET /notes/:id – Mengambil detail catatan berdasarkan ID
app.get("/notes/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const notes = await readNotes();
    const note = notes.find((n) => n.id === noteId);

    if (note) {
      res.status(200).json(note);
    } else {
      res.status(404).json({ message: "Catatan tidak ditemukan" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail catatan",
      error: error.message,
    });
  }
});

// 3. POST /notes – Menambahkan catatan baru
app.post("/notes", async (req, res) => {
  try {
    const { judul, isi } = req.body;

    // Validasi input: setidaknya salah satu dari judul atau isi harus diisi
    if (!judul && !isi) {
      return res
        .status(400)
        .json({ message: "Judul atau isi catatan wajib diisi" });
    }

    const newNote = {
      id: await generateNewId(),
      judul: judul ? String(judul) : "Tanpa Judul",
      isi: isi ? String(isi) : "",
      tanggal: new Date().toISOString(), // Timestamp pembuatan
      tanggalDiubah: null, // Belum pernah diubah
    };

    const notes = await readNotes();
    notes.push(newNote);
    await writeNotes(notes);

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error saat POST /notes:", error);
    res.status(500).json({
      message: "Gagal menambahkan catatan baru",
      error: error.message,
    });
  }
});

// 4. PUT /notes/:id – Mengedit catatan berdasarkan ID
app.put("/notes/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const { judul, isi } = req.body;

    // Validasi input: setidaknya salah satu dari judul atau isi harus diisi
    if (!judul && !isi) {
      return res
        .status(400)
        .json({ message: "Judul atau isi catatan wajib diisi" });
    }

    const notes = await readNotes();
    const noteIndex = notes.findIndex((n) => n.id === noteId);

    if (noteIndex !== -1) {
      const updatedNote = {
        ...notes[noteIndex],
        judul: judul ? String(judul) : "Tanpa Judul",
        isi: isi ? String(isi) : "",
        tanggalDiubah: new Date().toISOString(), // Update timestamp
      };

      notes[noteIndex] = updatedNote;
      await writeNotes(notes);

      res.status(200).json(updatedNote);
    } else {
      res.status(404).json({ message: "Catatan tidak ditemukan" });
    }
  } catch (error) {
    console.error("Error saat PUT /notes/:id :", error);
    res
      .status(500)
      .json({ message: "Gagal mengedit catatan", error: error.message });
  }
});

// 5. DELETE /notes/:id – Menghapus catatan
app.delete("/notes/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const notes = await readNotes();
    const filteredNotes = notes.filter((n) => n.id !== noteId);

    // Jika panjang array tidak berubah, berarti ID tidak ditemukan
    if (filteredNotes.length === notes.length) {
      return res.status(404).json({ message: "Catatan tidak ditemukan" });
    }

    await writeNotes(filteredNotes);
    res.sendStatus(204); // Berhasil tanpa mengirim data
  } catch (error) {
    console.error("Error saat DELETE /notes/:id :", error);
    res
      .status(500)
      .json({ message: "Gagal menghapus catatan", error: error.message });
  }
});

// --- Jalankan Server ---
app.listen(PORT, async () => {
  console.log(`🚀 Server API catatan berjalan di http://localhost:${PORT}`);
  await ensureDBFile();
  console.log(`💾 Menggunakan file database: ${DB_FILE}`);
});
