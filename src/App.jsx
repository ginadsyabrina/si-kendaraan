import React, { useEffect, useMemo, useState } from 'react';
const API = 'http://localhost/sikendaraan/backend';
const emptyVehicle = { nomor_polisi:'', merek:'', tipe_model:'', tahun_produksi:new Date().getFullYear(), warna:'', kondisi:'Baik', status:'Aktif', pegawai_id:'' };
const emptyEmployee = { nama:'', nip:'', jabatan:'', golongan:'', lokasi_kerja:'', opd_id:'' };
const emptyOpd = { kode_opd:'', nama_opd:'', alamat:'', keterangan:'', status:'Aktif' };

export default function App() {
  const [page,setPage]=useState('dashboard');
  const [vehicles,setVehicles]=useState([]); const [employees,setEmployees]=useState([]); const [opds,setOpds]=useState([]);
  const [opdForm,setOpdForm]=useState(emptyOpd); const [opdId,setOpdId]=useState(null);
  const [vehicleForm,setVehicleForm]=useState(emptyVehicle); const [employeeForm,setEmployeeForm]=useState(emptyEmployee);
  const [vehicleId,setVehicleId]=useState(null); const [employeeId,setEmployeeId]=useState(null);
  const [search,setSearch]=useState(''); const [employeeSearch, setEmployeeSearch] = useState(''); const [opdSearch, setOpdSearch] = useState(''); const [filter,setFilter]=useState('Semua'); const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);
  async function request(resource, method='GET', data=null, id=null, searchTerm='') {
  const endpoint = {
    kendaraan: 'kendaraan.php',
    pegawai: 'pegawai.php',
    'perangkat-daerah': 'opd.php'
  };

  const file = endpoint[resource];

  if (!file) {
    throw new Error('Endpoint API tidak ditemukan');
  }

  const params = new URLSearchParams();

  if (id) params.append('id', id);
  if (searchTerm) params.append('search', searchTerm);

  const url = `${API}/${file}${params.toString() ? `?${params}` : ''}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    ...(data ? { body: JSON.stringify(data) } : {})
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Permintaan gagal');
  }

  return result;
}

  async function loadData() {
    setLoading(true);
    try {
      const [v, e, o] = await Promise.all([
        request('kendaraan'),
        request('pegawai'),
        request('perangkat-daerah')
      ]);
      setVehicles(v.data || []);
      setEmployees(e.data || []);
      setOpds(o.data || []);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function searchVehicles(keyword) {
    try {
      const result = await request('kendaraan', 'GET', null, null, keyword);
      setVehicles(result.data || []);
    } catch (err) {
      flash(err.message);
    }
  }

  useEffect(() => {
    if (page !== 'kendaraan') return;
    const timer = setTimeout(() => searchVehicles(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search, page]);

  async function searchOpds(keyword) {
    try {
      const result = await request('perangkat-daerah', 'GET', null, null, keyword);
      setOpds(result.data || []);
    } catch (err) {
      flash(err.message);
    }
  }

  useEffect(() => {
    if (page !== 'perangkat-daerah') return;
    const timer = setTimeout(() => searchOpds(opdSearch.trim()), 400);
    return () => clearTimeout(timer);
  }, [opdSearch, page]);

  const filtered = useMemo(
    () => vehicles.filter(v => filter === 'Semua' || v.kondisi === filter),
    [vehicles, filter]
  );
  function flash(message){setNotice(message);setTimeout(()=>setNotice(''),3500);}
  async function saveVehicle(e){e.preventDefault();try{const data={...vehicleForm,pegawai_id:vehicleForm.pegawai_id||null};const result=await request('kendaraan',vehicleId?'PUT':'POST',data,vehicleId);flash(result.message);setVehicleForm(emptyVehicle);setVehicleId(null);await loadData();setPage('kendaraan');}catch(err){flash(err.message);}}
  async function saveEmployee(e){e.preventDefault();try{const result=await request('pegawai',employeeId?'PUT':'POST',employeeForm,employeeId);flash(result.message);setEmployeeForm(emptyEmployee);setEmployeeId(null);await loadData();setPage('pegawai');}catch(err){flash(err.message);}}
  function editVehicle(v){setVehicleForm({...v,pegawai_id:v.pegawai_id||''});setVehicleId(v.id);setPage('form-kendaraan');}
  function editEmployee(p){setEmployeeForm({nama:p.nama,nip:p.nip,jabatan:p.jabatan,golongan:p.golongan,lokasi_kerja:p.lokasi_kerja,opd_id:p.opd_id||''});setEmployeeId(p.id);setPage('form-pegawai');}
  async function saveOpd(e){e.preventDefault();try{const result=await request('perangkat-daerah',opdId?'PUT':'POST',opdForm,opdId);flash(result.message);setOpdForm(emptyOpd);setOpdId(null);await loadData();setPage('perangkat-daerah');}catch(err){flash(err.message);}}
  function editOpd(o){setOpdForm({kode_opd:o.kode_opd,nama_opd:o.nama_opd,alamat:o.alamat||'',keterangan:o.keterangan||'',status:o.status});setOpdId(o.id);setPage('form-opd');}
  async function remove(resource,id){if(!confirm('Yakin ingin menghapus data ini?'))return;try{const r=await request(resource,'DELETE',null,id);flash(r.message);await loadData();}catch(err){flash(err.message);}}
  const stats={total:vehicles.length,baik:vehicles.filter(v=>v.kondisi==='Baik').length,rusak:vehicles.filter(v=>v.kondisi!=='Baik').length,pegawai:employees.length};
  const nav=[['dashboard','▦','Dashboard'],['kendaraan','🚘','Data Kendaraan'],['pegawai','♙','Data Pegawai'],['perangkat-daerah','▤','Perangkat Daerah']];
  return <div className="layout"><aside className="sidebar"><div className="brand"><div className="brand-icon">KD</div><div><b>SI-KENDARAAN</b><small>Manajemen Kendaraan Dinas</small></div></div><div className="nav-label">MENU UTAMA</div>{nav.map(([key,icon,label])=><button key={key} className={`nav-item ${page===key?'active':''}`} onClick={()=>setPage(key)}><span>{icon}</span>{label}</button>)}<div className="side-bottom">Sistem Informasi Aset Daerah<br/>Versi 1.0.0</div></aside>
  <main className="main"><header className="topbar"><div><span className="eyebrow">ADMINISTRASI ASET DAERAH</span><h1>{({dashboard:'Dashboard',kendaraan:'Data Kendaraan Dinas',pegawai:'Data Pegawai', 'form-kendaraan':vehicleId?'Edit Kendaraan':'Tambah Kendaraan','form-pegawai':employeeId?'Edit Pegawai':'Tambah Pegawai','perangkat-daerah':'Data Perangkat Daerah','form-opd':opdId?'Edit Perangkat Daerah':'Tambah Perangkat Daerah'})[page]}</h1></div><div className="user"><div className="avatar">A</div><div><b>Administrator</b><small>Pengelola Aset</small></div></div></header>
  {notice&&<div className="notice">{notice}</div>}{loading&&<p className="muted">Memuat data...</p>}
  {page==='dashboard'&&<><div className="welcome"><div><h2>Selamat datang di SI-Kendaraan</h2><p>Kelola data kendaraan dinas operasional dan pegawai penanggung jawab dalam satu sistem.</p></div><div className="welcome-icon">🚙</div></div><div className="stats"><Stat label="Total Kendaraan" value={stats.total} icon="🚘"/><Stat label="Kondisi Baik" value={stats.baik} icon="✓"/><Stat label="Perlu Perhatian" value={stats.rusak} icon="⚠"/><Stat label="Pegawai Terdaftar" value={stats.pegawai} icon="♙"/></div><section className="panel"><div className="panel-head"><div><h3>Kendaraan Terbaru</h3><p>Ringkasan data kendaraan dinas operasional</p></div><button className="primary" onClick={()=>{setVehicleForm(emptyVehicle);setVehicleId(null);setPage('form-kendaraan')}}>＋ Tambah Kendaraan</button></div><VehicleTable rows={vehicles.slice(0,5)} onEdit={editVehicle} onDelete={id=>remove('kendaraan',id)}/></section></>}
  {page==='kendaraan'&&<section className="panel"><div className="panel-head"><div><h3>Daftar Kendaraan Dinas</h3><p>Data inventaris kendaraan operasional</p></div><button className="primary" onClick={()=>{setVehicleForm(emptyVehicle);setVehicleId(null);setPage('form-kendaraan')}}>＋ Tambah Kendaraan</button></div><div className="toolbar"><input placeholder="Cari nomor polisi, merek, pegawai..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Semua</option><option>Baik</option><option>Rusak Ringan</option><option>Rusak Berat</option></select></div><VehicleTable rows={filtered} onEdit={editVehicle} onDelete={id=>remove('kendaraan',id)}/></section>}
  {page==='pegawai'&&<section className="panel">
      <div className="panel-head">
        <div>
          <h3>Daftar Pegawai</h3>
          <p>Pegawai negeri sipil penanggung jawab kendaraan</p>
          </div>
          <button className="primary" onClick={()=>{setEmployeeForm(emptyEmployee);setEmployeeId(null);setPage('form-pegawai')}}>＋ Tambah Pegawai</button>
          </div><div className="toolbar">
            <input type="text"
             placeholder="Cari nama pegawai, NIP, jabatan, atau golongan..."
               value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
  />
</div>
          <div className="table-wrap"><table><thead><tr><th>Nama Pegawai</th><th>NIP</th><th>Jabatan</th><th>Golongan</th><th>Lokasi Kerja</th><th>Perangkat Daerah</th><th>Aksi</th></tr></thead><tbody>
            {employees.filter(p =>
  `${p.nama} ${p.nip} ${p.jabatan} ${p.golongan} ${p.lokasi_kerja} ${p.nama_opd || ''}`
    .toLowerCase()
    .includes(employeeSearch.toLowerCase())
).map(p =>
            <tr key={p.id}><td><b>{p.nama}</b></td><td>{p.nip}</td><td>{p.jabatan}</td><td>{p.golongan}</td><td>{p.lokasi_kerja}</td><td>{p.nama_opd||'-'}</td><td><div className="actions"><button onClick={()=>editEmployee(p)}>Edit</button><button className="danger" onClick={()=>remove('pegawai',p.id)}>Hapus</button></div></td></tr>)}{employees.length===0&&<Empty cols="7"/>}</tbody></table></div></section>}
  {page==='perangkat-daerah'&&<section className="panel"><div className="panel-head"><div><h3>Daftar Perangkat Daerah</h3><p>Unit organisasi pemerintah daerah pengelola kendaraan</p></div><button className="primary" onClick={()=>{setOpdForm(emptyOpd);setOpdId(null);setPage('form-opd')}}>＋ Tambah Perangkat Daerah</button></div><div className="toolbar"><input type="text" placeholder="Cari kode OPD, nama perangkat daerah, atau alamat..." value={opdSearch} onChange={e=>setOpdSearch(e.target.value)}/></div><div className="table-wrap"><table><thead><tr><th>Kode OPD</th><th>Nama Perangkat Daerah</th><th>Alamat</th><th>Status</th><th>Jumlah Pegawai</th><th>Aksi</th></tr></thead><tbody>{opds.map(o=><tr key={o.id}><td><b>{o.kode_opd}</b></td><td>{o.nama_opd}</td><td>{o.alamat||'-'}</td><td>{o.status}</td><td>{employees.filter(p=>String(p.opd_id)===String(o.id)).length}</td><td><div className="actions"><button onClick={()=>editOpd(o)}>Edit</button><button className="danger" onClick={()=>remove('perangkat-daerah',o.id)}>Hapus</button></div></td></tr>)}{opds.length===0&&<Empty cols="6"/>}</tbody></table></div></section>}
  {page==='form-opd'&&<section className="panel form-panel"><div className="panel-head"><div><h3>Informasi Perangkat Daerah</h3><p>Masukkan identitas unit organisasi</p></div></div><form onSubmit={saveOpd}><div className="form-grid"><Field label="Kode OPD" required><input required value={opdForm.kode_opd} onChange={e=>setOpdForm({...opdForm,kode_opd:e.target.value.toUpperCase()})} placeholder="Contoh: OPD-001"/></Field><Field label="Nama Perangkat Daerah" required><input required value={opdForm.nama_opd} onChange={e=>setOpdForm({...opdForm,nama_opd:e.target.value})} placeholder="Nama dinas"/></Field><Field label="Alamat"><input value={opdForm.alamat} onChange={e=>setOpdForm({...opdForm,alamat:e.target.value})}/></Field><Field label="Status" required><select value={opdForm.status} onChange={e=>setOpdForm({...opdForm,status:e.target.value})}><option>Aktif</option><option>Tidak Aktif</option></select></Field><Field label="Keterangan"><input value={opdForm.keterangan} onChange={e=>setOpdForm({...opdForm,keterangan:e.target.value})}/></Field></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>{setOpdForm(emptyOpd);setOpdId(null);setPage('perangkat-daerah')}}>Batal</button><button className="primary">{opdId?'Simpan Perubahan':'Simpan Perangkat Daerah'}</button></div></form></section>}
  {page==='form-kendaraan'&&<section className="panel form-panel"><div className="panel-head"><div><h3>Informasi Kendaraan</h3><p>Lengkapi identitas dan penanggung jawab kendaraan</p></div></div><form onSubmit={saveVehicle}><div className="form-grid"><Field label="Nomor Polisi" required><input required value={vehicleForm.nomor_polisi} onChange={e=>setVehicleForm({...vehicleForm,nomor_polisi:e.target.value.toUpperCase()})} placeholder="Contoh: B 1234 DKI"/></Field><Field label="Merek Kendaraan" required><input required value={vehicleForm.merek} onChange={e=>setVehicleForm({...vehicleForm,merek:e.target.value})} placeholder="Contoh: Toyota"/></Field><Field label="Tipe / Model" required><input required value={vehicleForm.tipe_model} onChange={e=>setVehicleForm({...vehicleForm,tipe_model:e.target.value})} placeholder="Contoh: Innova Zenix"/></Field><Field label="Tahun Produksi" required><input required type="number" min="1950" max={new Date().getFullYear()} value={vehicleForm.tahun_produksi} onChange={e=>setVehicleForm({...vehicleForm,tahun_produksi:e.target.value})}/></Field><Field label="Warna Kendaraan" required><input required value={vehicleForm.warna} onChange={e=>setVehicleForm({...vehicleForm,warna:e.target.value})} placeholder="Contoh: Hitam"/></Field><Field label="Kondisi Kendaraan" required><select value={vehicleForm.kondisi} onChange={e=>setVehicleForm({...vehicleForm,kondisi:e.target.value})}><option>Baik</option><option>Rusak Ringan</option><option>Rusak Berat</option></select></Field><Field label="Status Kendaraan" required><select value={vehicleForm.status} onChange={e=>setVehicleForm({...vehicleForm,status:e.target.value})}><option>Aktif</option><option>Tidak Aktif</option><option>Dalam Perbaikan</option></select></Field><Field label="Pegawai Penanggung Jawab"><select value={vehicleForm.pegawai_id} onChange={e=>setVehicleForm({...vehicleForm,pegawai_id:e.target.value})}><option value="">-- Belum ditentukan --</option>{employees.map(p=><option key={p.id} value={p.id}>{p.nama} ({p.nip})</option>)}</select></Field></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>{setVehicleForm(emptyVehicle);setVehicleId(null);setPage('kendaraan')}}>Batal</button><button className="primary">{vehicleId?'Simpan Perubahan':'Simpan Kendaraan'}</button></div></form></section>}
  {page==='form-pegawai'&&<section className="panel form-panel"><div className="panel-head"><div><h3>Informasi Pegawai</h3><p>Lengkapi identitas pegawai penanggung jawab</p></div></div><form onSubmit={saveEmployee}><div className="form-grid"><Field label="Nama Pegawai" required><input required value={employeeForm.nama} onChange={e=>setEmployeeForm({...employeeForm,nama:e.target.value})}/></Field><Field label="NIP" required><input required value={employeeForm.nip} onChange={e=>setEmployeeForm({...employeeForm,nip:e.target.value})} placeholder="18 digit NIP"/></Field><Field label="Jabatan" required><input required value={employeeForm.jabatan} onChange={e=>setEmployeeForm({...employeeForm,jabatan:e.target.value})}/></Field><Field label="Golongan" required><select required value={employeeForm.golongan} onChange={e=>setEmployeeForm({...employeeForm,golongan:e.target.value})}><option value="">Pilih golongan</option>{['I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'].map(g=><option key={g}>{g}</option>)}</select></Field><Field label="Lokasi Kerja" required><input required value={employeeForm.lokasi_kerja} onChange={e=>setEmployeeForm({...employeeForm,lokasi_kerja:e.target.value})} placeholder="Contoh: Kantor Dinas Pendidikan"/></Field><Field label="Perangkat Daerah" required><select required value={employeeForm.opd_id} onChange={e=>setEmployeeForm({...employeeForm,opd_id:e.target.value})}><option value="">Pilih perangkat daerah</option>{opds.filter(o=>o.status==='Aktif').map(o=><option key={o.id} value={o.id}>{o.nama_opd}</option>)}</select></Field></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>{setEmployeeForm(emptyEmployee);setEmployeeId(null);setPage('pegawai')}}>Batal</button><button className="primary">{employeeId?'Simpan Perubahan':'Simpan Pegawai'}</button></div></form></section>}
  <footer>© 2026 Sistem Informasi Kendaraan Dinas Operasional</footer></main></div>;
}
function Stat({label,value,icon}){return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>}
function Field({label,required,children}){return <label className="field"><span>{label}{required&&<i> *</i>}</span>{children}</label>}
function Empty({cols}){return <tr><td colSpan={cols} className="empty">Belum ada data untuk ditampilkan.</td></tr>}
function VehicleTable({rows,onEdit,onDelete}){return <div className="table-wrap"><table><thead><tr><th>Nomor Polisi</th><th>Kendaraan</th><th>Tahun</th><th>Kondisi</th><th>Status</th><th>Penanggung Jawab</th><th>Perangkat Daerah</th><th>Aksi</th></tr></thead><tbody>{rows.map(v=><tr key={v.id}><td><b>{v.nomor_polisi}</b></td><td>{v.merek} {v.tipe_model}<small className="subcell">{v.warna}</small></td><td>{v.tahun_produksi}</td><td><span className={`pill ${v.kondisi==='Baik'?'good':v.kondisi==='Rusak Ringan'?'warning':'bad'}`}>{v.kondisi}</span></td><td>{v.status}</td><td>{v.nama_pegawai||<span className="muted">Belum ditentukan</span>}</td><td>{v.nama_opd||'-'}</td><td><div className="actions"><button onClick={()=>onEdit(v)}>Edit</button><button className="danger" onClick={()=>onDelete(v.id)}>Hapus</button></div></td></tr>)}{rows.length===0&&<Empty cols="8"/>}</tbody></table></div>}
