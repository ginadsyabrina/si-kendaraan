
import { useState } from "react";
import {
  LayoutDashboard, Car, Users, Building2,
  UserCog, LogOut, Menu, Bell, Search,
  Truck, CheckCircle, AlertTriangle
} from "lucide-react";
import "./App.css";

function App() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const menus = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Perangkat Daerah", icon: Building2 },
    { name: "Data Pegawai", icon: Users },
    { name: "Data Kendaraan", icon: Car },
    { name: "Manajemen User", icon: UserCog }
  ];

  const stats = [
    { title: "Total Kendaraan", value: "125", icon: Truck },
    { title: "Kendaraan Aktif", value: "110", icon: CheckCircle },
    { title: "Dalam Perbaikan", value: "10", icon: AlertTriangle },
    { title: "Total Pegawai", value: "95", icon: Users }
  ];

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <Car size={30} />
          <div>
            <h2>SI-KENDARAAN</h2>
            <small>Manajemen Kendaraan Dinas</small>
          </div>
        </div>

        <div className="menu-title">MENU UTAMA</div>

        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <button
              key={menu.name}
              className={`menu-item ${
                activeMenu === menu.name ? "active" : ""
              }`}
              onClick={() => setActiveMenu(menu.name)}
            >
              <Icon size={19} />
              <span>{menu.name}</span>
            </button>
          );
        })}

        <div className="sidebar-bottom">
          <button className="menu-item">
            <LogOut size={19} />
            <span>Logout</span>
          </button>
          <small>SI-Kendaraan v1.0</small>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="topbar">
          <div>
            <h2>{activeMenu}</h2>
            <p>Sistem Informasi Kendaraan Dinas Operasional</p>
          </div>

          <div className="profile">
            <Bell size={21} />
            <div className="avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        {activeMenu === "Dashboard" && (
          <>
            <section className="welcome">
              <div>
                <h2>Selamat Datang, Administrator!</h2>
                <p>
                  Sistem Informasi Pengelolaan Kendaraan
                  Dinas Operasional Perangkat Daerah.
                </p>
              </div>
            </section>

            <h3 className="section-title">Ringkasan Data</h3>

            <section className="stats-grid">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-icon">
                      <Icon size={25} />
                    </div>
                    <div>
                      <p>{stat.title}</p>
                      <h2>{stat.value}</h2>
                    </div>
                  </div>
                );
              })}
            </section>

            <h3 className="section-title">Perangkat Daerah</h3>

            <section className="opd-grid">
              <div className="opd-card">
                <Building2 />
                <h3>Dinas Pendidikan</h3>
                <p>Pengelolaan kendaraan dinas pendidikan</p>
              </div>

              <div className="opd-card">
                <Building2 />
                <h3>Dinas Kesehatan</h3>
                <p>Pengelolaan kendaraan dinas kesehatan</p>
              </div>

              <div className="opd-card">
                <Building2 />
                <h3>Dinas PUPR</h3>
                <p>Dinas Pekerjaan Umum dan Penataan Ruang</p>
              </div>
            </section>

            <section className="table-card">
              <h3>Data Kendaraan Terbaru</h3>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nomor Polisi</th>
                      <th>Merek</th>
                      <th>Perangkat Daerah</th>
                      <th>Kondisi</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>B 1234 DKI</td>
                      <td>Toyota Avanza</td>
                      <td>Dinas Pendidikan</td>
                      <td>Baik</td>
                      <td><span className="status-active">Aktif</span></td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>B 5678 DKI</td>
                      <td>Honda CR-V</td>
                      <td>Dinas Kesehatan</td>
                      <td>Baik</td>
                      <td><span className="status-active">Aktif</span></td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>B 9012 DKI</td>
                      <td>Mitsubishi L300</td>
                      <td>Dinas PUPR</td>
                      <td>Rusak Ringan</td>
                      <td><span className="status-repair">Perbaikan</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeMenu !== "Dashboard" && (
          <section className="table-card">
            <h2>{activeMenu}</h2>
            <p>
              Modul {activeMenu} akan kita buat pada
              tahap berikutnya.
            </p>
          </section>
        )}

      </main>
    </div>
  );
}

export default App;
