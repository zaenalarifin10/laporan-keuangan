const BIN_ID = '6a58696cf5f4af5e2995e5ad';
const MASTER_KEY = '$2a$10$r7I.AEjQuUfcR1rKNWFanuDpJcYhqz.EmTPRL3aWxY3H.hiGx6ZmC';
const API_URL = `https://jsonbin.io{BIN_ID}`;

let localData = [];

// Atur input tanggal otomatis ke hari ini
document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];

// 1. MEMUAT DATA DARI SERVER (GET)
async function fetchData() {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'X-Master-Key': MASTER_KEY,
                'X-Bin-Meta': 'false' // Mengambil konten data murninya saja
            }
        });
        
        // Membaca array dari properti "transaksi" sesuai Langkah 1
        localData = response.data.transaksi || [];
        renderTable();
    } catch (error) {
        console.error('Error saat mengambil data:', error);
        alert('Gagal memuat data dari JSONBin. Pastikan format data awal di JSONBin sudah disesuaikan.');
    }
}

// 2. ME-RENDER DATA KE TABEL HTML
function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    let totalSaldo = 0;

    if (localData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="loading">Belum ada riwayat transaksi.</td></tr>`;
        document.getElementById('total-saldo').innerText = 'Rp 0';
        return;
    }

    localData.forEach(item => {
        const dep = Number(item.deposit) || 0;
        const peng = Number(item.pengeluaran) || 0;
        totalSaldo += (dep - peng);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center">${item.tanggal}</td>
            <td>${item.prihal}</td>
            <td>${item.pengguna}</td>
            <td class="text-right deposit-val">${dep > 0 ? 'Rp ' + dep.toLocaleString('id-ID') : '-'}</td>
            <td class="text-right pengeluaran-val">${peng > 0 ? 'Rp ' + peng.toLocaleString('id-ID') : '-'}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('total-saldo').innerText = 'Rp ' + totalSaldo.toLocaleString('id-ID');
}

// 3. ATUR POP-UP MODAL (BUKA / TUTUP)
function toggleModal(show) {
    const modal = document.getElementById('modalOverlay');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
        document.getElementById('transaksiForm').reset();
        document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    }
}

// 4. MENGIRIM DATA BARU KE SERVER (PUT)
document.getElementById('transaksiForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btnSimpan = document.getElementById('btnSimpan');
    btnSimpan.innerText = 'Menyimpan...';
    btnSimpan.disabled = true;

    const tanggal = document.getElementById('tanggal').value;
    const prihal = document.getElementById('prihal').value;
    const pengguna = document.getElementById('pengguna').value;
    const jenis = document.getElementById('jenis').value;
    const nominal = parseInt(document.getElementById('nominal').value) || 0;

    const dataBaru = {
        tanggal: tanggal,
        prihal: prihal,
        pengguna: pengguna,
        deposit: jenis === 'deposit' ? nominal : 0,
        pengeluaran: jenis === 'pengeluaran' ? nominal : 0
    };

    // Gabungkan array data kas lama dengan transaksi baru
    const updatedTransaksi = [...localData, dataBaru];

    try {
        // Kirim data utuh yang baru dibungkus objek transaksi ke JSONBin
        await axios.put(API_URL, {
            transaksi: updatedTransaksi
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            }
        });

        localData = updatedTransaksi;
        renderTable();
        toggleModal(false);
    } catch (error) {
        console.error('Error saat menyimpan data:', error);
        alert('Gagal mengirim data: ' + (error.response?.data?.message || error.message));
    } finally {
        btnSimpan.innerText = 'Simpan Data';
        btnSimpan.disabled = false;
    }
});

// Jalankan fungsi load data saat halaman web GitHub Pages dibuka
fetchData();
