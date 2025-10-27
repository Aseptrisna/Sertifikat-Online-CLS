/*
 * FILE: generateCertificates.js
 * DESKRIPSI: Skrip ini dijalankan SATU KALI untuk membuat semua sertifikat
 * dan menyimpannya ke database MongoDB.
 * CARA MENJALANKAN: node generateCertificates.js
 */

// Impor dan konfigurasikan dotenv di baris paling atas
require('dotenv').config();

const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const mongoose = require('mongoose');
const path = require('path');

// --- KONFIGURASI ---
// Ambil MONGO_URI dari file .env
const MONGO_URI = process.env.MONGO_URI;

// Daftar 34 nama peserta (Ganti dengan nama asli)
const participantNames = [
    "Adi Tasya Nurzahra",
    "Agustinus Tampubolon",
    "Andri Fajria",
    "Asep Harpenas",
    "Asep Trisna Setiawan, S.Kom., M.T.",
    "Asri Setyaningrum",
    "Astri Anisah Padni",
    "Ayu Latifah",
    "Azizah Zakiah",
    "Cantika Maharani",
    "Dewi Tresnawati, M.T.",
    "Djadja Achmad Sardjana",
    "Eko Nugroho",
    "Ghitaswasti Praweswari Andrean",
    "Intan Hestika Dhesy A.",
    "Ir. Erdy Suryadarma, S.T.",
    "Lilaning Sosialsih",
    "Matahari Deva Ramadhan",
    "Misbah Amin Nurdi",
    "Mohd Shahrizal Sunar",
    "Muhamad Roby Ashari",
    "Muhammad Fahmi Nurfadilah",
    "Nina Lestari, M.T",
    "Okwan Himpuni",
    "Rahmawati",
    "Raymond Bahana",
    "Rini Ainun Nisya",
    "Roto Priyono",
    "Sadida Satri",
    "Sandri Justiana",
    "Sofyan Eko Putra",
    "Sri Rahayu",
    "Tik Santikasari Dewi",
    "Widyanto Eko Nugroho"
];

// Path ke file template PDF Anda
// Saya perbaiki path ini kembali seperti semula, sepertinya ada typo di kode Anda
const templatePath = path.join(__dirname, 'template', 'template.pdf');
// Path ke folder output
const outputPath = path.join(__dirname, 'public', 'certificates');
// --- AKHIR KONFIGURASI ---

// 1. Definisikan Skema dan Model Mongoose
const certificateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: true
});

// Hapus model lama jika ada (untuk menghindari error saat reload)
if (mongoose.models.Certificate) {
    delete mongoose.models.Certificate;
}
const Certificate = mongoose.model('Certificate', certificateSchema);

// 2. Fungsi Utama Generator
async function generateCertificates() {
    console.log('Memulai proses generator sertifikat...');

    try {
        // 3. Hubungkan ke MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('Berhasil terhubung ke MongoDB.');

        // 4. Muat template PDF
        const templateBytes = fs.readFileSync(templatePath);

        // 5. Loop untuk setiap nama
        for (const name of participantNames) {
            console.log(`Memproses: ${name}`);

            // Buat nama file yang "aman" (slug)
            const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
            const outputFileName = `sertifikat-${slug}.pdf`;
            const outputFilePath = path.join(outputPath, outputFileName);
            const publicAccessPath = `/certificates/${outputFileName}`;

            // Muat template untuk setiap sertifikat baru
            const pdfDoc = await PDFDocument.load(templateBytes);
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Ambil halaman pertama
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // --- LOGIKA BARU UNTUK RATA TENGAH ---

            // Tentukan Ukuran dan Posisi Y (Vertikal)
            const nameSize = 40; // Ukuran font
            const nameY = 280;   // Posisi Y (jarak dari bawah)

            // 1. Dapatkan lebar halaman
            const pageWidth = firstPage.getWidth();

            // 2. Hitung lebar teks nama
            const textWidth = font.widthOfTextAtSize(name, nameSize);

            // 3. Hitung koordinat X agar posisi tepat di tengah
            const nameX = (pageWidth - textWidth) / 2;

            // --- AKHIR LOGIKA BARU ---

            // PENTING: Gunakan nameX yang sudah dihitung
            // (0, 0) ada di kiri bawah.
            firstPage.drawText(name, {
                x: nameX, // <-- X dihitung secara dinamis
                y: nameY, // <-- GANTI INI (Jarak dari bawah)
                size: nameSize,
                font: font,
                color: rgb(0, 0, 0), // Warna hitam
            });

            // 6. Simpan file PDF baru
            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(outputFilePath, pdfBytes);

            // 7. Simpan ke MongoDB (Upsert: update jika ada, buat baru jika tidak)
            await Certificate.findOneAndUpdate(
                { name: name }, // Kriteria pencarian
                { filePath: publicAccessPath }, // Data yang di-update
                { upsert: true, new: true, setDefaultsOnInsert: true } // Opsi
            );

            console.log(`Berhasil dibuat/diupdate: ${outputFileName}`);
        }

        console.log('\nSelesai! Semua sertifikat telah dibuat dan disimpan ke database.');

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    } finally {
        // 8. Tutup koneksi DB
        await mongoose.connection.close();
        console.log('Koneksi MongoDB ditutup.');
    }
}

// Jalankan fungsi
generateCertificates();




