import React, { useMemo, useState } from 'react';

export default function Dashboard({ vehicles = [], employees = [], opds = [], canWrite, isAdmin, onAddVehicle, onEditVehicle, onDeleteVehicle, VehicleTable }) {
  const [dashboardOpdFilter, setDashboardOpdFilter] = useState('Semua');

  const dashboardEmployees = useMemo(() => dashboardOpdFilter === 'Semua'
    ? employees
    : employees.filter(p => String(p.opd_id) === String(dashboardOpdFilter)), [employees, dashboardOpdFilter]);
  const dashboardEmployeeIds = useMemo(() => new Set(dashboardEmployees.map(p => String(p.id))), [dashboardEmployees]);
  const dashboardVehicles = useMemo(() => dashboardOpdFilter === 'Semua'
    ? vehicles
    : vehicles.filter(v => {
        if (v.opd_id !== undefined && v.opd_id !== null) return String(v.opd_id) === String(dashboardOpdFilter);
        return v.pegawai_id !== null && v.pegawai_id !== undefined && dashboardEmployeeIds.has(String(v.pegawai_id));
      }), [vehicles, dashboardOpdFilter, dashboardEmployeeIds]);

  const stats = {
    total: dashboardVehicles.length,
    baik: dashboardVehicles.filter(v => v.kondisi === 'Baik').length,
    rusakRingan: dashboardVehicles.filter(v => v.kondisi === 'Rusak Ringan').length,
    rusakBerat: dashboardVehicles.filter(v => v.kondisi === 'Rusak Berat').length,
    aktif: dashboardVehicles.filter(v => v.status === 'Aktif').length,
    tidakAktif: dashboardVehicles.filter(v => v.status === 'Tidak Aktif').length,
    perbaikan: dashboardVehicles.filter(v => v.status === 'Dalam Perbaikan').length,
    pegawai: dashboardEmployees.length
  };
  const conditionRows = [
    { label: 'Baik', value: stats.baik, className: 'chart-good' },
    { label: 'Rusak Ringan', value: stats.rusakRingan, className: 'chart-warning' },
    { label: 'Rusak Berat', value: stats.rusakBerat, className: 'chart-bad' }
  ];
  const statusRows = [
    { label: 'Aktif', value: stats.aktif, className: 'chart-good' },
    { label: 'Tidak Aktif', value: stats.tidakAktif, className: 'chart-muted' },
    { label: 'Dalam Perbaikan', value: stats.perbaikan, className: 'chart-warning' }
  ];
  const opdRows = opds.map(opd => {
    const opdEmployees = employees.filter(p => String(p.opd_id) === String(opd.id));
    const employeeIds = new Set(opdEmployees.map(p => String(p.id)));
    const count = vehicles.filter(v => v.opd_id !== undefined && v.opd_id !== null
      ? String(v.opd_id) === String(opd.id)
      : v.pegawai_id !== null && v.pegawai_id !== undefined && employeeIds.has(String(v.pegawai_id))).length;
    return { id: opd.id, label: opd.nama_opd, value: count, className: 'chart-primary' };
  }).sort((a, b) => b.value - a.value);
  const employeeOpdRows = opds.map(opd => ({
    id: opd.id,
    label: opd.nama_opd,
    value: employees.filter(p => String(p.opd_id) === String(opd.id)).length,
    className: 'chart-teal'
  })).sort((a, b) => b.value - a.value);

  return <>
    <div className="welcome"><div><h2>Selamat datang di SI-Kendaraan</h2><p>Monitoring kendaraan dinas operasional dan pegawai penanggung jawab.</p></div><div className="welcome-icon">🚙</div></div>
    <section className="dashboard-filter panel">
      <div><b>Filter Perangkat Daerah</b><small>Statistik menyesuaikan OPD yang dipilih.</small></div>
      <select value={dashboardOpdFilter} onChange={e => setDashboardOpdFilter(e.target.value)}>
        <option value="Semua">Semua Perangkat Daerah</option>
        {opds.map(o => <option key={o.id} value={o.id}>{o.nama_opd}</option>)}
      </select>
    </section>
    <div className="stats">
      <Stat label="Total Kendaraan" value={stats.total} icon="🚘" />
      <Stat label="Kondisi Baik" value={stats.baik} icon="✓" />
      <Stat label="Perlu Perhatian" value={stats.rusakRingan + stats.rusakBerat} icon="⚠" />
      <Stat label="Pegawai Terdaftar" value={stats.pegawai} icon="♙" />
    </div>
    <div className="dashboard-grid">
      <section className="panel dashboard-chart-panel"><div className="panel-head"><div><h3>Kondisi Kendaraan</h3><p>Distribusi kondisi kendaraan pada filter terpilih</p></div></div><DashboardBars rows={conditionRows} total={stats.total} /></section>
      <section className="panel dashboard-chart-panel"><div className="panel-head"><div><h3>Status Kendaraan</h3><p>Status operasional kendaraan</p></div></div><DashboardBars rows={statusRows} total={stats.total} /></section>
      <section className="panel dashboard-chart-panel"><div className="panel-head"><div><h3>Jumlah Kendaraan per OPD</h3><p>Perbandingan jumlah kendaraan berdasarkan perangkat daerah</p></div></div>
        {opdRows.length ? <DashboardBars rows={opdRows} total={Math.max(...opdRows.map(r => r.value), 0)} /> : <div className="dashboard-empty">Belum ada data perangkat daerah.</div>}
      </section>
      <section className="panel dashboard-chart-panel"><div className="panel-head"><div><h3>Pegawai per OPD</h3><p>Jumlah pegawai terdaftar pada setiap perangkat daerah</p></div></div>
        {opds.length ? <DashboardBars rows={employeeOpdRows} total={Math.max(...employeeOpdRows.map(r => r.value), 0)} /> : <div className="dashboard-empty">Belum ada data perangkat daerah.</div>}
      </section>
    </div>
    <section className="panel"><div className="panel-head"><div><h3>Kendaraan Terbaru</h3><p>Ringkasan data kendaraan dinas operasional</p></div>{canWrite && <button className="primary" onClick={onAddVehicle}>＋ Tambah Kendaraan</button>}</div>
      {VehicleTable && <VehicleTable rows={dashboardVehicles.slice(0, 5)} onEdit={onEditVehicle} onDelete={onDeleteVehicle} canWrite={canWrite} isAdmin={isAdmin} />}
    </section>
  </>;
}

function Stat({ label, value, icon }) {
  return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function DashboardBars({ rows, total }) {
  const max = Math.max(total || 0, ...rows.map(row => Number(row.value) || 0), 1);
  return <div className="dashboard-bars">{rows.map((row, index) => {
    const value = Number(row.value) || 0;
    const width = value ? Math.max((value / max) * 100, 2) : 0;
    return <div className="dashboard-bar-row" key={row.id ?? row.label ?? index}>
      <div className="dashboard-bar-label"><span title={row.label}>{row.label}</span><b>{value}</b></div>
      <div className="dashboard-bar-track"><div className={`dashboard-bar-fill ${row.className || 'chart-primary'}`} style={{ width: `${width}%` }} /></div>
    </div>;
  })}</div>;
}
