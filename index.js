/*
 * FILE: server.js
 * DESKRIPSI: Server web Express.js yang berjalan terus-menerus
 * untuk menyajikan halaman unduh dan API pencarian.
 * CARA MENJALANKAN: node server.js
 */

// Impor dan konfigurasikan dotenv di baris paling atas
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// --- KONFIGURASI ---
const app = express();
const PORT = process.env.PORT;
// Ambil MONGO_URI dari file .env
const MONGO_URI = process.env.MONGO_URI;
// --- AKHIR KONFIGURASI ---

// 1. Hubungkan ke MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('Berhasil terhubung ke MongoDB.'))
    .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// 2. Impor Model (pastikan skema-nya sama dengan di generateCertificates.js)
const certificateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Hapus model lama jika ada (untuk menghindari error saat reload)
if (mongoose.models.Certificate) {
    delete mongoose.models.Certificate;
}
const Certificate = mongoose.model('Certificate', certificateSchema);


// 3. Middleware
// Menyajikan file statis (HTML, CSS, JS, dan sertifikat PDF) dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 4. API Endpoint BARU untuk mengambil SEMUA sertifikat
// Ini akan dipanggil oleh frontend saat halaman dimuat
app.get('/all-certificates', async (req, res) => {
    try {
        // Ambil semua data, jangan di-sort di sini
        // Kita akan sort di frontend menggunakan JavaScript
        const allCertificates = await Certificate.find({});

        if (!allCertificates || allCertificates.length === 0) {
            return res.status(404).json({ message: 'Tidak ada sertifikat di database.' });
        }

        // Kirim semua hasil
        res.json(allCertificates);

    } catch (error) {
        console.error('Error saat mengambil semua sertifikat:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// 5. Rute utama untuk menyajikan halaman HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});


