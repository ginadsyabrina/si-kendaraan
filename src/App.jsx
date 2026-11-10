import React, { useEffect, useMemo, useState } from 'react';
import Dashboard from './components/dashboard/Dashboard.jsx';
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
  const [authUser,setAuthUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [loginForm,setLoginForm]=useState({username:'',password:''});
  const [showLoginPassword,setShowLoginPassword]=useState(false);
  const [showCreatePassword,setShowCreatePassword]=useState(false);
  const [users,setUsers]=useState([]);
  const [userForm,setUserForm]=useState({pegawai_id:'',username:'',password:'',role:'viewer'});
  const [userEdit,setUserEdit]=useState({});
  const [auditLogs,setAuditLogs]=useState([]);
  const [selectedAuditLog,setSelectedAuditLog]=useState(null);
  const [historyVehicleId,setHistoryVehicleId]=useState('');
  const [auditSearch,setAuditSearch]=useState('');
  const [auditModule,setAuditModule]=useState('Semua');
  const [auditActivity,setAuditActivity]=useState('Semua');
  const [auditDateFrom,setAuditDateFrom]=useState('');
  const [auditDateTo,setAuditDateTo]=useState('');
  const [auditLoading,setAuditLoading]=useState(false);
  const canWrite = authUser && ['administrator','inputer'].includes(authUser.role);
  const isAdmin = authUser?.role === 'administrator';
  const roleLabel = {administrator:'Administrator',inputer:'Inputer',viewer:'Viewer'};
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
    credentials: 'include',
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

  async function checkSession() {
    try {
      const response = await fetch(`${API}/auth.php?action=me`, {credentials:'include'});
      const result = await response.json();
      if (result.success && result.data) setAuthUser(result.data);
    } catch (err) {
      setNotice('Tidak dapat terhubung ke server. Pastikan Apache dan MySQL berjalan.');
    } finally {
      setAuthLoading(false);
    }
  }
  useEffect(() => { checkSession(); }, []);
  useEffect(() => { if (authUser) loadData(); }, [authUser]);

  // Otomatis logout setelah 15 menit tanpa aktivitas pengguna.
  useEffect(() => {
    if (!authUser) return undefined;

    let timeoutId;
    let logoutStarted = false;
    const TIMEOUT_MS = 15 * 60 * 1000;

    const endSessionForInactivity = async () => {
      if (logoutStarted) return;
      logoutStarted = true;
      try {
        await fetch(`${API}/auth.php?action=logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        });
      } catch (error) {
        // Session server tetap memiliki perlindungan timeout.
      } finally {
        setAuthUser(null);
        setUsers([]);
        setAuditLogs([]);
        setSelectedAuditLog(null);
        setPage('dashboard');
        setNotice('Sesi berakhir karena tidak ada aktivitas selama 15 menit. Silakan login kembali.');
      }
    };

    const resetInactivityTimer = () => {
      if (logoutStarted) return;
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(endSessionForInactivity, TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(eventName =>
      window.addEventListener(eventName, resetInactivityTimer, { passive: true })
    );
    resetInactivityTimer();

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach(eventName =>
        window.removeEventListener(eventName, resetInactivityTimer)
      );
    };
  }, [authUser]);

  async function login(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/auth.php?action=login`, {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(loginForm)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Login gagal');
      setAuthUser(result.data); setLoginForm({username:'',password:''}); setNotice('');
      setPage('dashboard');
    } catch(err) { setNotice(err.message); }
  }
  async function logout() {
    try {
      await fetch(`${API}/auth.php?action=logout`, {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:'{}'});
      setAuthUser(null); setUsers([]); setPage('dashboard');
    } catch(err) { flash(err.message); }
  }
  async function loadUsers() {
    try {
      const response = await fetch(`${API}/auth.php?action=users`, {credentials:'include'});
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat akun');
      setUsers(result.data || []);
    } catch(err) { flash(err.message); }
  }
  async function loadAuditLogs() {
    if (!isAdmin) return;
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({limit:'500'});
      const response = await fetch(`${API}/audit_logs.php?${params.toString()}`, {credentials:'include'});
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat riwayat aktivitas');
      setAuditLogs(result.data || []);
    } catch(err) { flash(err.message); }
    finally { setAuditLoading(false); }
  }

  async function createUser(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${API}/auth.php?action=users`, {
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(userForm)
      });
      const result=await response.json();
      if(!response.ok || !result.success) throw new Error(result.message || 'Gagal membuat akun');
      flash(result.message); setUserForm({pegawai_id:'',username:'',password:'',role:'viewer'}); await loadUsers();
    } catch(err) { flash(err.message); }
  }
  async function updateUser(userId) {
    const edit=userEdit[userId];
    try {
      const response=await fetch(`${API}/auth.php?action=users`, {
        method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({user_id:userId,role:edit.role,status:edit.status})
      });
      const result=await response.json();
      if(!response.ok || !result.success) throw new Error(result.message || 'Gagal memperbarui akun');
      flash(result.message); await loadUsers();
    } catch(err) { flash(err.message); }
  }

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
  const filteredAuditLogs = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase();
    const matchesSearch = [log.username,log.nama_pengguna,log.aktivitas,log.modul,log.keterangan,log.ip_address]
      .some(v => String(v || '').toLowerCase().includes(q));
    const logDate = String(log.created_at || '').slice(0, 10);
    const matchesFrom = !auditDateFrom || logDate >= auditDateFrom;
    const matchesTo = !auditDateTo || logDate <= auditDateTo;
    return matchesSearch &&
      (auditModule === 'Semua' || log.modul === auditModule) &&
      (auditActivity === 'Semua' || log.aktivitas === auditActivity) &&
      matchesFrom && matchesTo;
  });

  function exportAuditCsv() {
    if (!filteredAuditLogs.length) {
      flash('Tidak ada data untuk diekspor.');
      return;
    }
    const headers = ['Waktu','Pengguna','Username','Role','Aktivitas','Modul','ID Data','Keterangan','IP Address','Data Sebelum','Data Sesudah'];
    const rows = filteredAuditLogs.map(log => [
      log.created_at || '', log.nama_pengguna || '', log.username || '',
      log.role || '', log.aktivitas || '', log.modul || '',
      log.record_id ?? '', log.keterangan || '', log.ip_address || '', log.data_sebelum || '', log.data_sesudah || ''
    ]);
    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(escapeCsv).join(';')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `riwayat-aktivitas-si-kendaraan-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    flash(`Berhasil menyiapkan ${filteredAuditLogs.length} catatan untuk diekspor.`);
  }

  const historyVehicle = vehicles.find(v => String(v.id) === String(historyVehicleId));
  const vehicleHistoryLogs = auditLogs
    .filter(log => log.modul === 'Kendaraan' && String(log.record_id) === String(historyVehicleId))
    .filter(log => ['Tambah','Edit','Hapus'].includes(log.aktivitas))
    .sort((a,b) => new Date(String(b.created_at).replace(' ','T')) - new Date(String(a.created_at).replace(' ','T')));

  const nav=[['dashboard','▦','Dashboard'],['kendaraan','🚘','Data Kendaraan'],['pegawai','♙','Data Pegawai'],['perangkat-daerah','▤','Perangkat Daerah'],...(isAdmin?[['users','♙','Manajemen Akun'],['audit','▤','Riwayat Aktivitas'],['vehicle-history','◷','Riwayat Kendaraan']]:[])];
  if (authLoading) return <div className="auth-screen"><div className="auth-card"><div className="brand-icon">KD</div><h2>SI-KENDARAAN</h2><p>Memeriksa sesi login...</p></div></div>;

if (!authUser) return (
  <div className="auth-screen">
    <form className="auth-card" onSubmit={login}>
      <div className="brand-icon">KD</div>
      <h2>SI-KENDARAAN</h2>
      <p>Manajemen Kendaraan Dinas</p>

      {notice && (
  <div className={`notice ${notice.toLowerCase().includes('sudah terdaftar') ? 'notice-error' : ''}`}>
    {notice}
  </div>
)}

      <label className="field">
        Username
        <input
          required
          autoComplete="username"
          value={loginForm.username}
          onChange={e =>
            setLoginForm({
              ...loginForm,
              username: e.target.value
            })
          }
          placeholder="Masukkan username"
        />
      </label>

      <label className="field">
        Password
        <div className="password-field">
          <input
            required
            type={showLoginPassword ? "text" : "password"}
            autoComplete="current-password"
            value={loginForm.password}
            onChange={e =>
              setLoginForm({
                ...loginForm,
                password: e.target.value
              })
            }
            placeholder="Masukkan password"
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowLoginPassword(v => !v)
            }
            aria-label={
              showLoginPassword
                ? "Sembunyikan password"
                : "Tampilkan password"
            }
            title={
              showLoginPassword
                ? "Sembunyikan password"
                : "Tampilkan password"
            }
          >
            {showLoginPassword ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3M6.2 6.2C3.8 7.8 2.6 10.1 2.5 12c1 2.5 4.5 7 9.5 7 1.1 0 2.1-.2 3-.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
              </svg>
            )}
          </button>
        </div>
      </label>

      <button className="primary auth-submit">
        Masuk
      </button>
    </form>
  </div>
);

  return <div className="layout"><aside className="sidebar"><div className="brand"><div className="brand-icon">KD</div><div><b>SI-KENDARAAN</b><small>Manajemen Kendaraan Dinas</small></div></div><div className="nav-label">MENU UTAMA</div>{nav.map(([key,icon,label])=><button key={key} className={`nav-item ${page===key?'active':''}`} onClick={()=>{setPage(key);if(key==='users')loadUsers();if(key==='audit'||key==='vehicle-history')loadAuditLogs();}}><span>{icon}</span>{label}</button>)}<div className="side-bottom">Sistem Informasi Aset Daerah<br/>Versi 1.0.0</div></aside>
  <main className="main"><header className="topbar"><div><span className="eyebrow">ADMINISTRASI ASET DAERAH</span><h1>{({dashboard:'Dashboard',kendaraan:'Data Kendaraan Dinas',pegawai:'Data Pegawai', 'form-kendaraan':vehicleId?'Edit Kendaraan':'Tambah Kendaraan','form-pegawai':employeeId?'Edit Pegawai':'Tambah Pegawai','perangkat-daerah':'Data Perangkat Daerah','form-opd':opdId?'Edit Perangkat Daerah':'Tambah Perangkat Daerah','users':'Manajemen Akun Pengguna','audit':'Riwayat Aktivitas','vehicle-history':'Riwayat Perubahan Kendaraan'})[page]}</h1></div><div className="user"><div className="avatar">{(authUser.nama||authUser.username||"U").charAt(0).toUpperCase()}</div><div><b>{authUser.nama}</b><small>{roleLabel[authUser.role] || authUser.role}</small></div><button className="secondary" onClick={logout}>Keluar</button></div></header>

  {notice && (
  <div className={`notice ${notice.toLowerCase().includes('sudah terdaftar') ? 'notice-error' : ''}`}>
    {notice}
  </div>
)}
{loading && <p className="muted">Memuat data...</p>}

  {page==='dashboard'&&<Dashboard
    vehicles={vehicles}
    employees={employees}
    opds={opds}
    canWrite={canWrite}
    isAdmin={isAdmin}
    onAddVehicle={()=>{setVehicleForm(emptyVehicle);setVehicleId(null);setPage('form-kendaraan')}}
    onEditVehicle={editVehicle}
    onDeleteVehicle={id=>remove('kendaraan',id)}
    VehicleTable={VehicleTable}
  />}

  {page==='kendaraan'&&<section className="panel"><div className="panel-head"><div><h3>Daftar Kendaraan Dinas</h3><p>Data inventaris kendaraan operasional</p></div>{canWrite&&<button className="primary" onClick={()=>{setVehicleForm(emptyVehicle);setVehicleId(null);setPage('form-kendaraan')}}>＋ Tambah Kendaraan</button>}</div><div className="toolbar"><input placeholder="Cari nomor polisi, merek, pegawai..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Semua</option><option>Baik</option><option>Rusak Ringan</option><option>Rusak Berat</option></select></div><VehicleTable rows={filtered} onEdit={editVehicle} onDelete={id=>remove('kendaraan',id)} canWrite={canWrite} isAdmin={isAdmin}/></section>}

  {page==='pegawai'&&<section className="panel">
      <div className="panel-head">
        <div>
          <h3>Daftar Pegawai</h3>
          <p>Pegawai negeri sipil penanggung jawab kendaraan</p>
          </div>
          {canWrite&&<button className="primary" onClick={()=>{setEmployeeForm(emptyEmployee);setEmployeeId(null);setPage('form-pegawai')}}>＋ Tambah Pegawai</button>}
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
            <tr key={p.id}><td><b>{p.nama}</b></td><td>{p.nip}</td><td>{p.jabatan}</td><td>{p.golongan}</td><td>{p.lokasi_kerja}</td><td>{p.nama_opd||'-'}</td><td><div className="actions">{canWrite&&<button onClick={()=>editEmployee(p)}>Edit</button>}{isAdmin&&<button className="danger" onClick={()=>remove('pegawai',p.id)}>Hapus</button>}</div></td></tr>)}{employees.length===0&&<Empty cols="7"/>}</tbody></table></div></section>}
  {page==='perangkat-daerah'&&<section className="panel"><div className="panel-head"><div><h3>Daftar Perangkat Daerah</h3><p>Unit organisasi pemerintah daerah pengelola kendaraan</p></div>{canWrite&&<button className="primary" onClick={()=>{setOpdForm(emptyOpd);setOpdId(null);setPage('form-opd')}}>＋ Tambah Perangkat Daerah</button>}</div><div className="toolbar"><input type="text" placeholder="Cari kode OPD, nama perangkat daerah, atau alamat..." value={opdSearch} onChange={e=>setOpdSearch(e.target.value)}/></div><div className="table-wrap"><table><thead><tr><th>Kode OPD</th><th>Nama Perangkat Daerah</th><th>Alamat</th><th>Status</th><th>Jumlah Pegawai</th><th>Aksi</th></tr></thead><tbody>{opds.map(o=><tr key={o.id}><td><b>{o.kode_opd}</b></td><td>{o.nama_opd}</td><td>{o.alamat||'-'}</td><td>{o.status}</td><td>{employees.filter(p=>String(p.opd_id)===String(o.id)).length}</td><td><div className="actions">{canWrite&&<button onClick={()=>editOpd(o)}>Edit</button>}{isAdmin&&<button className="danger" onClick={()=>remove('perangkat-daerah',o.id)}>Hapus</button>}</div></td></tr>)}{opds.length===0&&<Empty cols="6"/>}</tbody></table></div></section>}
  {page==='form-opd'&&canWrite&&<section className="panel form-panel"><div className="panel-head"><div><h3>Informasi Perangkat Daerah</h3><p>Masukkan identitas unit organisasi</p></div></div><form onSubmit={saveOpd}><div className="form-grid"><Field label="Kode OPD" required><input required value={opdForm.kode_opd} onChange={e=>setOpdForm({...opdForm,kode_opd:e.target.value.toUpperCase()})} placeholder="Contoh: OPD-001"/></Field><Field label="Nama Perangkat Daerah" required><input required value={opdForm.nama_opd} onChange={e=>setOpdForm({...opdForm,nama_opd:e.target.value})} placeholder="Nama dinas"/></Field><Field label="Alamat"><input value={opdForm.alamat} onChange={e=>setOpdForm({...opdForm,alamat:e.target.value})}/></Field><Field label="Status" required><select value={opdForm.status} onChange={e=>setOpdForm({...opdForm,status:e.target.value})}><option>Aktif</option><option>Tidak Aktif</option></select></Field><Field label="Keterangan"><input value={opdForm.keterangan} onChange={e=>setOpdForm({...opdForm,keterangan:e.target.value})}/></Field></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>{setOpdForm(emptyOpd);setOpdId(null);setPage('perangkat-daerah')}}>Batal</button><button className="primary">{opdId?'Simpan Perubahan':'Simpan Perangkat Daerah'}</button></div></form></section>}
  {page==='form-kendaraan'&&canWrite&&<section className="panel form-panel"><div className="panel-head"><div><h3>Informasi Kendaraan</h3><p>Lengkapi identitas dan penanggung jawab kendaraan</p></div></div><form onSubmit={saveVehicle}><div className="form-grid"><Field label="Nomor Polisi" required><input required value={vehicleForm.nomor_polisi} onChange={e=>setVehicleForm({...vehicleForm,nomor_polisi:e.target.value.toUpperCase()})} placeholder="Contoh: B 1234 DKI"/></Field><Field label="Merek Kendaraan" required><input required value={vehicleForm.merek} onChange={e=>setVehicleForm({...vehicleForm,merek:e.target.value})} placeholder="Contoh: Toyota"/></Field><Field label="Tipe / Model" required><input required value={vehicleForm.tipe_model} onChange={e=>setVehicleForm({...vehicleForm,tipe_model:e.target.value})} placeholder="Contoh: Innova Zenix"/></Field><Field label="Tahun Produksi" required><input required type="number" min="1950" max={new Date().getFullYear()} value={vehicleForm.tahun_produksi} onChange={e=>setVehicleForm({...vehicleForm,tahun_produksi:e.target.value})}/></Field><Field label="Warna Kendaraan" required><input required value={vehicleForm.warna} onChange={e=>setVehicleForm({...vehicleForm,warna:e.target.value})} placeholder="Contoh: Hitam"/></Field><Field label="Kondisi Kendaraan" required><select value={vehicleForm.kondisi} onChange={e=>setVehicleForm({...vehicleForm,kondisi:e.target.value})}><option>Baik</option><option>Rusak Ringan</option><option>Rusak Berat</option></select></Field><Field label="Status Kendaraan" required><select value={vehicleForm.status} onChange={e=>setVehicleForm({...vehicleForm,status:e.target.value})}><option>Aktif</option><option>Tidak Aktif</option><option>Dalam Perbaikan</option></select></Field><Field label="Pegawai Penanggung Jawab"><select value={vehicleForm.pegawai_id} onChange={e=>setVehicleForm({...vehicleForm,pegawai_id:e.target.value})}><option value="">-- Belum ditentukan --</option>{employees.map(p=><option key={p.id} value={p.id}>{p.nama} ({p.nip})</option>)}</select></Field></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>{setVehicleForm(emptyVehicle);setVehicleId(null);setPage('kendaraan')}}>Batal</button><button className="primary">{vehicleId?'Simpan Perubahan':'Simpan Kendaraan'}</button></div></form></section>}
  {page==='form-pegawai'&&canWrite&&<section className="panel form-panel"><div className="panel-head"><div><h3>Informasi Pegawai</h3><p>Lengkapi identitas pegawai penanggung jawab</p></div></div><form onSubmit={saveEmployee}><div className="form-grid"><Field label="Nama Pegawai" required><input required value={employeeForm.nama} onChange={e=>setEmployeeForm({...employeeForm,nama:e.target.value})}/></Field><Field label="NIP" required><input required value={employeeForm.nip} onChange={e=>setEmployeeForm({...employeeForm,nip:e.target.value})} placeholder="18 digit NIP"/></Field><Field label="Jabatan" required><input required value={employeeForm.jabatan} onChange={e=>setEmployeeForm({...employeeForm,jabatan:e.target.value})}/></Field><Field label="Golongan" required><select required value={employeeForm.golongan} onChange={e=>setEmployeeForm({...employeeForm,golongan:e.target.value})}><option value="">Pilih golongan</option>{['I/a','I/b','I/c','I/d','II/a','II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e'].map(g=><option key={g}>{g}</option>)}</select></Field><Field label="Lokasi Kerja" required><input required value={employeeForm.lokasi_kerja} onChange={e=>setEmployeeForm({...employeeForm,lokasi_kerja:e.target.value})} placeholder="Contoh: Kantor Dinas Pendidikan"/></Field><Field label="Perangkat Daerah" required><select required value={employeeForm.opd_id} onChange={e=>setEmployeeForm({...employeeForm,opd_id:e.target.value})}><option value="">Pilih perangkat daerah</option>{opds.filter(o=>o.status==='Aktif').map(o=><option key={o.id} value={o.id}>{o.nama_opd}</option>)}</select></Field></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>{setEmployeeForm(emptyEmployee);setEmployeeId(null);setPage('pegawai')}}>Batal</button><button className="primary">{employeeId?'Simpan Perubahan':'Simpan Pegawai'}</button></div></form></section>}
  {page==='users'&&isAdmin&&<section className="panel"><div className="panel-head"><div><h3>Manajemen Akun Pegawai</h3><p>Satu pegawai hanya dapat memiliki satu akun. Akun dibuat oleh Administrator.</p></div><button className="secondary" onClick={loadUsers}>Muat Ulang</button></div><form onSubmit={createUser} className="user-create"><div className="form-grid"><Field label="Pegawai" required><select required value={userForm.pegawai_id} onChange={e=>setUserForm({...userForm,pegawai_id:e.target.value})}><option value="">Pilih pegawai yang belum memiliki akun</option>{users.filter(u=>!u.user_id).map(u=><option key={u.pegawai_id} value={u.pegawai_id}>{u.nama} — {u.nip}</option>)}</select></Field><Field label="Username" required><input required value={userForm.username} onChange={e=>setUserForm({...userForm,username:e.target.value})} placeholder="contoh: nama.pegawai"/></Field><Field label="Password (minimal 8 karakter)" required><div className="password-field"><input required type={showCreatePassword?'text':'password'} minLength="8" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})}/><button type="button" className="password-toggle" onClick={()=>setShowCreatePassword(v=>!v)} aria-label={showCreatePassword?'Sembunyikan password':'Tampilkan password'} title={showCreatePassword?'Sembunyikan password':'Tampilkan password'}>{showCreatePassword ? (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.2-2.3 3.3M6.2 6.2C3.8 7.8 2.6 10.1 2.5 12c1 2.5 4.5 7 9.5 7 1.1 0 2.1-.2 3-.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
) : (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
)}</button></div></Field><Field label="Role" required><select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option value="administrator">Administrator</option><option value="inputer">Inputer</option><option value="viewer">Viewer</option></select></Field></div><div className="form-actions"><button className="primary">＋ Buat Akun</button></div></form><div className="table-wrap"><table><thead><tr><th>Pegawai</th><th>NIP</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{users.map(u=><tr key={u.pegawai_id}><td><b>{u.nama}</b><small className="subcell">{u.nama_opd||'-'}</small></td><td>{u.nip}</td><td>{u.username||<span className="muted">Belum memiliki akun</span>}</td><td>{u.user_id?<select value={userEdit[u.user_id]?.role||u.role} onChange={e=>setUserEdit({...userEdit,[u.user_id]:{role:e.target.value,status:userEdit[u.user_id]?.status||u.status}})}><option value="administrator">Administrator</option><option value="inputer">Inputer</option><option value="viewer">Viewer</option></select>:'-'}</td><td>{u.user_id?<select value={userEdit[u.user_id]?.status||u.status} onChange={e=>setUserEdit({...userEdit,[u.user_id]:{role:userEdit[u.user_id]?.role||u.role,status:e.target.value}})}><option>Aktif</option><option>Tidak Aktif</option></select>:'-'}</td><td>{u.user_id?<button className="secondary" onClick={()=>updateUser(u.user_id)}>Simpan</button>:'-'}</td></tr>)}{users.length===0&&<Empty cols="6"/>}</tbody></table></div></section>}

  {page==='vehicle-history'&&isAdmin&&<section className="panel">
    <div className="panel-head">
      <div><h3>Riwayat Perubahan Kendaraan</h3><p>Pilih kendaraan untuk melihat catatan tambah, edit, dan hapus yang tersimpan di Audit Log.</p></div>
      <button className="secondary" onClick={loadAuditLogs}>Muat Ulang</button>
    </div>
    <div className="vehicle-history-toolbar">
      <label className="field"><span>Pilih Kendaraan</span>
        <select value={historyVehicleId} onChange={e=>setHistoryVehicleId(e.target.value)}>
          <option value="">-- Pilih nomor polisi --</option>
          {vehicles.map(v=><option key={v.id} value={v.id}>{v.nomor_polisi} — {v.merek} {v.tipe_model}</option>)}
        </select>
      </label>
    </div>
    {!historyVehicleId&&<div className="history-empty">Pilih kendaraan untuk menampilkan riwayat perubahannya.</div>}
    {historyVehicleId&&historyVehicle&&<div className="history-vehicle-summary">
      <div><small>Nomor Polisi</small><b>{historyVehicle.nomor_polisi}</b></div>
      <div><small>Kendaraan</small><b>{historyVehicle.merek} {historyVehicle.tipe_model}</b></div>
      <div><small>Tahun Produksi</small><b>{historyVehicle.tahun_produksi}</b></div>
      <div><small>Kondisi Saat Ini</small><b>{historyVehicle.kondisi}</b></div>
      <div><small>Status Saat Ini</small><b>{historyVehicle.status}</b></div>
    </div>}
    {historyVehicleId&&<div className="vehicle-history-list">
      <div className="history-list-heading"><h4>Linimasa Aktivitas</h4><span>{vehicleHistoryLogs.length} catatan ditemukan</span></div>
      {vehicleHistoryLogs.length===0
        ? <div className="history-empty">Belum ada riwayat untuk kendaraan ini pada 500 catatan Audit Log terbaru.</div>
        : vehicleHistoryLogs.map(log=><article className="vehicle-history-item" key={log.id}>
            <div className="history-timeline-dot"/>
            <div className="vehicle-history-card">
              <div className="history-card-top">
                <span className={`pill ${log.aktivitas==='Hapus'?'bad':log.aktivitas==='Tambah'?'good':'warning'}`}>{log.aktivitas}</span>
                <time>{log.created_at?new Date(String(log.created_at).replace(' ','T')).toLocaleString('id-ID'):'-'}</time>
              </div>
              <b>{log.nama_pengguna||log.username||'Pengguna tidak diketahui'}</b>
              <p>{log.keterangan||'Tidak ada keterangan'}</p>
              <div className="history-card-bottom">
                <small>{log.username||'-'} · {log.role||'-'} · ID Data #{log.record_id}</small>
                <button className="secondary audit-detail-button" onClick={()=>setSelectedAuditLog(log)}>Lihat Detail</button>
              </div>
            </div>
          </article>)}
    </div>}
    <p className="muted">Riwayat ini hanya dapat dilihat Administrator dan menggunakan catatan Audit Log yang tersedia.</p>
  </section>}

  {page==='audit'&&isAdmin&&<section className="panel">
    <div className="panel-head">
      <div><h3>Riwayat Aktivitas Pengguna</h3><p>Catatan login, logout, dan perubahan data pada SI-Kendaraan</p></div>
      <button className="secondary" onClick={loadAuditLogs}>Muat Ulang</button>
    </div>
    <div className="toolbar audit-toolbar">
      <input value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} placeholder="Cari pengguna, aktivitas, modul, atau keterangan..."/>
      <select value={auditModule} onChange={e=>setAuditModule(e.target.value)}>
        <option value="Semua">Semua Modul</option>
        {[...new Set(auditLogs.map(log=>log.modul).filter(Boolean))].sort().map(mod=> <option key={mod} value={mod}>{mod}</option>)}
      </select>
      <select value={auditActivity} onChange={e=>setAuditActivity(e.target.value)}>
        <option value="Semua">Semua Aktivitas</option>
        {[...new Set(auditLogs.map(log=>log.aktivitas).filter(Boolean))].sort().map(act=><option key={act} value={act}>{act}</option>)}
      </select>
      <label className="audit-date-field">Dari tanggal<input type="date" value={auditDateFrom} onChange={e=>setAuditDateFrom(e.target.value)}/></label>
      <label className="audit-date-field">Sampai tanggal<input type="date" value={auditDateTo} min={auditDateFrom || undefined} onChange={e=>setAuditDateTo(e.target.value)}/></label>
      <button className="secondary" onClick={()=>{setAuditSearch('');setAuditModule('Semua');setAuditActivity('Semua');setAuditDateFrom('');setAuditDateTo('');}}>Reset Filter</button>
      <button className="primary" onClick={exportAuditCsv}>↓ Export Excel (CSV)</button>
    </div>
    {auditLoading&&<p className="muted">Memuat riwayat aktivitas...</p>}
    <div className="table-wrap"><table><thead><tr>
      <th>Waktu</th><th>Pengguna</th><th>Role</th><th>Aktivitas</th><th>Modul</th><th>ID Data</th><th>Keterangan</th><th>IP Address</th><th>Detail</th>
    </tr></thead><tbody>
      {filteredAuditLogs.map(log=><tr key={log.id}>
        <td>{log.created_at?new Date(String(log.created_at).replace(' ','T')).toLocaleString('id-ID'):'-'}</td>
        <td><b>{log.nama_pengguna||log.username||'-'}</b><small className="subcell">{log.username||'-'}</small></td>
        <td>{log.role||'-'}</td><td><span className="pill good">{log.aktivitas||'-'}</span></td>
        <td>{log.modul||'-'}</td><td>{log.record_id??'-'}</td><td>{log.keterangan||'-'}</td><td>{log.ip_address||'-'}</td><td><button className="secondary audit-detail-button" onClick={()=>setSelectedAuditLog(log)}>Lihat Detail</button></td>
      </tr>)}
      {!auditLoading&&filteredAuditLogs.length===0&&<tr><td colSpan="9" className="empty">Tidak ada aktivitas yang sesuai.</td></tr>}
    </tbody></table></div>
    <p className="muted">Menampilkan maksimal 500 catatan terbaru. Hanya Administrator yang dapat melihat riwayat ini.</p>
  </section>}
    {selectedAuditLog&&isAdmin&&<div className="audit-modal-backdrop" onClick={()=>setSelectedAuditLog(null)}>
      <div className="audit-modal" role="dialog" aria-modal="true" aria-label="Detail perubahan data" onClick={e=>e.stopPropagation()}>
        <div className="audit-modal-head">
          <div><h3>Detail Riwayat Aktivitas</h3><p>{selectedAuditLog.modul} · {selectedAuditLog.aktivitas} · ID #{selectedAuditLog.record_id??'-'}</p></div>
          <button className="secondary" onClick={()=>setSelectedAuditLog(null)}>Tutup</button>
        </div>
        <div className="audit-meta-grid">
          <div><small>Pengguna</small><b>{selectedAuditLog.nama_pengguna||selectedAuditLog.username||'-'}</b></div>
          <div><small>Username / Role</small><b>{selectedAuditLog.username||'-'} / {selectedAuditLog.role||'-'}</b></div>
          <div><small>Waktu</small><b>{selectedAuditLog.created_at?new Date(String(selectedAuditLog.created_at).replace(' ','T')).toLocaleString('id-ID'):'-'}</b></div>
          <div><small>Keterangan</small><b>{selectedAuditLog.keterangan||'-'}</b></div>
        </div>
        <div className="audit-snapshot-grid">
          <div className="audit-snapshot">
            <h4>Data Sebelum</h4>
            {renderAuditSnapshot(selectedAuditLog.data_sebelum, selectedAuditLog.data_sesudah, selectedAuditLog.modul, employees)}
          </div>
          <div className="audit-snapshot">
            <h4>Data Sesudah</h4>
            {renderAuditSnapshot(selectedAuditLog.data_sesudah, selectedAuditLog.data_sebelum, selectedAuditLog.modul, employees)}
          </div>
        </div>
      </div>
    </div>}
    <footer>© 2026 Sistem Informasi Kendaraan Dinas Operasional</footer></main></div>;
}
function Field({label,required,children}){return <label className="field"><span>{label}{required&&<i> *</i>}</span>{children}</label>}
function Empty({cols}){return <tr><td colSpan={cols} className="empty">Belum ada data untuk ditampilkan.</td></tr>}
function VehicleTable({rows,onEdit,onDelete,canWrite,isAdmin}){return <div className="table-wrap"><table><thead><tr><th>Nomor Polisi</th><th>Kendaraan</th><th>Tahun</th><th>Kondisi</th><th>Status</th><th>Penanggung Jawab</th><th>Perangkat Daerah</th><th>Aksi</th></tr></thead><tbody>{rows.map(v=><tr key={v.id}><td><b>{v.nomor_polisi}</b></td><td>{v.merek} {v.tipe_model}<small className="subcell">{v.warna}</small></td><td>{v.tahun_produksi}</td><td><span className={`pill ${v.kondisi==='Baik'?'good':v.kondisi==='Rusak Ringan'?'warning':'bad'}`}>{v.kondisi}</span></td><td>{v.status}</td><td>{v.nama_pegawai||<span className="muted">Belum ditentukan</span>}</td><td>{v.nama_opd||'-'}</td><td><div className="actions">{canWrite&&<button onClick={()=>onEdit(v)}>Edit</button>}{isAdmin&&<button className="danger" onClick={()=>onDelete(v.id)}>Hapus</button>}</div></td></tr>)}{rows.length===0&&<Empty cols="8"/>}</tbody></table></div>}

function renderAuditSnapshot(raw, counterpartRaw, modul, employees = []) {
  if (!raw) return <p className="muted">Tidak ada snapshot untuk aktivitas ini.</p>;

  const parseSnapshot = source => {
    if (!source) return {};
    if (typeof source === 'object') return source;
    try { return JSON.parse(source); }
    catch { return {}; }
  };

  const values = parseSnapshot(raw);
  const counterpart = parseSnapshot(counterpartRaw);
  if (!Object.keys(values).length) return <p className="muted">Tidak ada detail data.</p>;

  const labels = {
    id:'ID', nomor_polisi:'Nomor Polisi', merek:'Merek', tipe_model:'Tipe / Model',
    tahun_produksi:'Tahun Produksi', warna:'Warna', kondisi:'Kondisi', status:'Status',
    pegawai_id:'Nama Pegawai Penanggung Jawab', nama:'Nama Pegawai', nip:'NIP',
    jabatan:'Jabatan', golongan:'Golongan', lokasi_kerja:'Lokasi Kerja', opd_id:'ID OPD',
    kode_opd:'Kode OPD', nama_opd:'Nama OPD', alamat:'Alamat',
    keterangan:'Keterangan'
  };

  const displayValue = (key, value) => {
    if (key === 'pegawai_id') {
      const employee = employees.find(person => String(person.id) === String(value));
      if (value === null || value === '') return 'Belum ditentukan';
      return employee ? employee.nama : `Pegawai tidak ditemukan (ID ${value})`;
    }
    return value === null || value === '' ? '-' : String(value);
  };

  return <div className="audit-snapshot-list">{Object.entries(values).map(([key,value]) => {
    const changed = displayValue(key, value) !== displayValue(key, counterpart[key]);
    return <div className="audit-snapshot-row" key={key}>
      <span>{labels[key] || key.replaceAll('_',' ')}</span>
      <div className="audit-snapshot-value">
        <b>{displayValue(key, value)}</b>
        <span className={`audit-change-badge ${changed ? 'changed' : 'same'}`}>
          {changed ? 'Berubah' : 'Tetap'}
        </span>
      </div>
    </div>;
  })}</div>;
}
