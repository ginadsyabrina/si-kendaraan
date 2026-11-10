import { useCallback, useEffect, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, X, Users, RefreshCw,
} from "lucide-react";

const API_PEGAWAI = "http://localhost/sikendaraan/backend/pegawai.php";
const API_OPD = "http://localhost/sikendaraan/backend/opd.php";

const initialForm = {
  id: "", nama: "", nip: "", jabatan: "",
  golongan: "", lokasi_kerja: "", opd_id: "",
};

export default function Pegawai() {
  const [pegawai, setPegawai] = useState([]);
  const [opd, setOpd] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Mengambil pegawai dari API. Kata kunci dikirim ke PHP melalui parameter search.
  const loadPegawai = useCallback(async (keyword = "", signal) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${API_PEGAWAI}?search=${encodeURIComponent(keyword)}`,
        { signal }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data pegawai.");
      }
      setPegawai(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Tidak dapat terhubung ke server.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const loadOPD = useCallback(async () => {
    try {
      const response = await fetch(API_OPD);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data OPD.");
      }
      setOpd(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Tidak dapat mengambil data perangkat daerah.");
    }
  }, []);

  useEffect(() => {
    loadOPD();
  }, [loadOPD]);

  // Otomatis mencari setelah jeda 300 ms; membatalkan request pencarian lama.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      loadPegawai(search.trim(), controller.signal);
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, loadPegawai]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((old) => ({ ...old, [name]: value }));
  };

  const handleAdd = () => {
    setForm(initialForm);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setForm({
      id: item.id,
      nama: item.nama || "",
      nip: String(item.nip || ""),
      jabatan: item.jabatan || "",
      golongan: item.golongan || "",
      lokasi_kerja: item.lokasi_kerja || "",
      opd_id: String(item.opd_id || ""),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\d{18}$/.test(form.nip.trim())) {
      alert("NIP harus terdiri dari tepat 18 digit angka.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(API_PEGAWAI, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nip: form.nip.trim(),
          opd_id: Number(form.opd_id),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan data pegawai.");
      }
      alert(result.message || "Data pegawai berhasil disimpan.");
      setShowForm(false);
      setForm(initialForm);
      setSearch("");
      await loadPegawai("");
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data pegawai ini?")) return;
    try {
      const response = await fetch(
        `${API_PEGAWAI}?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menghapus data pegawai.");
      }
      alert(result.message || "Data pegawai berhasil dihapus.");
      await loadPegawai(search.trim());
    } catch (err) {
      alert(err.message || "Terjadi kesalahan saat menghapus data.");
    }
  };

  return (
    <div className="pegawai-page">
      <div className="opd-toolbar">
        <div>
          <h2>Daftar Pegawai</h2>
          <p>Pegawai negeri sipil penanggung jawab kendaraan</p>
        </div>
        <button className="btn-primary" onClick={handleAdd} type="button">
          <Plus size={18} /> Tambah Pegawai
        </button>
      </div>

      <div className="pegawai-summary">
        <div className="stat-card">
          <div className="stat-icon"><Users size={25} /></div>
          <div><p>Total Pegawai</p><h2>{pegawai.length}</h2></div>
        </div>
      </div>

      {/* Kotak pencarian tampil di atas tabel pegawai. */}
      <div style={{ marginTop: "18px" }}>
        <label htmlFor="pegawai-search-input" style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "#526579", fontSize: "14px" }}>Cari Data Pegawai</label>
      <div className="opd-search pegawai-search" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "520px", minHeight: "48px", boxSizing: "border-box", padding: "0 16px", margin: "20px 0", background: "#ffffff", border: "1px solid #d8e2eb", borderRadius: "10px", color: "#64748b" }}>
        <Search size={19} />
        <input
          id="pegawai-search-input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama pegawai atau NIP (bisa sebagian angka)..."
          aria-label="Cari nama pegawai atau NIP"
          style={{ flex: 1, width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", color: "#243b53", fontSize: "14px" }}
        />
        {search && (
          <button
            type="button"
            className="btn-close"
            onClick={() => setSearch("")}
            title="Hapus pencarian"
            aria-label="Hapus pencarian"
          >
            <X size={17} />
          </button>
        )}
      </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button type="button" onClick={() => loadPegawai(search.trim())}>
            <RefreshCw size={15} /> Coba lagi
          </button>
        </div>
      )}

      <div className="table-card">
        <h3>Daftar Pegawai</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>No</th><th>Nama Pegawai</th><th>NIP</th>
                <th>Jabatan</th><th>Golongan</th><th>Lokasi Kerja</th>
                <th>Perangkat Daerah</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Memuat data...</td></tr>
              ) : pegawai.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    {search
                      ? `Tidak ditemukan pegawai dengan kata kunci "${search}".`
                      : "Belum ada data pegawai."}
                  </td>
                </tr>
              ) : pegawai.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td><strong>{item.nama}</strong></td>
                  <td>{String(item.nip || "")}</td>
                  <td>{item.jabatan}</td>
                  <td>{item.golongan}</td>
                  <td>{item.lokasi_kerja || "-"}</td>
                  <td>{item.nama_opd || "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button" className="btn-edit"
                        onClick={() => handleEdit(item)} title="Edit pegawai"
                      ><Pencil size={16} /></button>
                      <button
                        type="button" className="btn-delete"
                        onClick={() => handleDelete(item.id)} title="Hapus pegawai"
                      ><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{form.id ? "Edit Data Pegawai" : "Tambah Data Pegawai"}</h3>
              <button
                type="button" className="btn-close"
                onClick={() => setShowForm(false)} aria-label="Tutup formulir"
              ><X /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Nama Pegawai *</label>
              <input
                name="nama" value={form.nama} onChange={handleChange}
                placeholder="Masukkan nama lengkap" required
              />

              <label>NIP *</label>
              <input
                name="nip" type="text" inputMode="numeric" maxLength={18}
                pattern="[0-9]{18}" value={form.nip} onChange={handleChange}
                placeholder="Masukkan 18 digit NIP" required
              />

              <label>Jabatan *</label>
              <input
                name="jabatan" value={form.jabatan} onChange={handleChange}
                placeholder="Masukkan jabatan" required
              />

              <label>Golongan *</label>
              <select
                name="golongan" value={form.golongan}
                onChange={handleChange} required
              >
                <option value="">Pilih Golongan</option>
                {[
                  "I/a", "I/b", "I/c", "I/d", "II/a", "II/b", "II/c", "II/d",
                  "III/a", "III/b", "III/c", "III/d",
                  "IV/a", "IV/b", "IV/c", "IV/d", "IV/e",
                ].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>

              <label>Lokasi Kerja</label>
              <input
                name="lokasi_kerja" value={form.lokasi_kerja}
                onChange={handleChange} placeholder="Contoh: Kantor Dinas Pendidikan"
              />

              <label>Perangkat Daerah *</label>
              <select
                name="opd_id" value={form.opd_id}
                onChange={handleChange} required
              >
                <option value="">Pilih Perangkat Daerah</option>
                {opd.filter((item) => item.status === "Aktif").map((item) => (
                  <option key={item.id} value={item.id}>{item.nama_opd}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button
                  type="button" className="btn-cancel"
                  onClick={() => setShowForm(false)} disabled={saving}
                >Batal</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
