// Konfigurasi API JSONBin.io kredensial milik Anda
const BIN_ID = '6a58696cf5f4af5e2995e5ad';
const MASTER_KEY = '$2a$10$r7I.AEjQuUfcR1rKNWFanuDpJcYhqz.EmTPRL3aWxY3H.hiGx6ZmC';
const API_URL = `https://jsonbin.io{BIN_ID}`;

let localData = [];

// Atur tanggal hari ini di form input saat dimuat
document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];

// Fungsi mengambil data dari API JSONBin
async function fetchData() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 
                'X-Master-Key': MASTER_KEY,
                'X-Bin-Meta': 'false' // Mengabaikan meta-data bawaan JSONBin agar langsung mendapat array data
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        // Memastikan data yang diambil berformat Array
        localData = Array.isArray(result) ? result : (result.record || []);
        renderTable();
    } catch (error) {
        console.error('Detail Error:', error);
        alert('Gagal memuat data dari server. Pastikan Anda menjalankan aplikasi menggunakan Local Server (Live Server/HTTP Server).');
    }
}

// Fungsi memproses data array ke elemen tabel HTML
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

// Fungsi membuka dan menutup jendela Pop-up Form
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

// Handler event saat user menekan tombol simpan form
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

    // Gabungkan riwayat data lama dengan entri data yang baru dibuat
    const updatedData = [...localData, dataBaru];

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            localData = updatedData;
            renderTable();
            toggleModal(false);
        } else {
            throw new Error(`Gagal menyimpan! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Detail Error:', error);
        alert('Kesalahan sistem saat menyimpan: ' + error.message);
    } finally {
        btnSimpan.innerText = 'Simpan Data';
        btnSimpan.disabled = false;
    }
});

// Eksekusi pengambilan data secara otomatis saat web dibuka
fetchData();
