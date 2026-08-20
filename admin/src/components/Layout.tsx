import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';

const links = [
  { to: '/business', label: 'İşletme Bilgileri' },
  { to: '/campaigns', label: 'Kampanyalar' },
  { to: '/blog', label: 'Blog' },
  { to: '/customers', label: 'Müşteriler' },
  { to: '/products', label: 'Ürünler' },
  { to: '/scan', label: 'QR Tarayıcı' },
];

export function Layout() {
  const logout = useAdminAuthStore((state) => state.logout);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Laos Admin</h1>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {link.label}
          </NavLink>
        ))}
        <button type="button" onClick={logout} style={{ marginTop: 24 }}>
          Çıkış Yap
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
