import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Store, Megaphone, Newspaper, Users, Coffee, ScanLine, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { Button } from './Button';

const links = [
  { to: '/business', label: 'İşletme Bilgileri', icon: Store },
  { to: '/campaigns', label: 'Kampanyalar', icon: Megaphone },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/customers', label: 'Müşteriler', icon: Users },
  { to: '/products', label: 'Ürünler', icon: Coffee },
  { to: '/scan', label: 'QR Tarayıcı', icon: ScanLine },
];

const titlesByPath = Object.fromEntries(links.map((link) => [link.to, link.label]));

export function Layout() {
  const logout = useAdminAuthStore((state) => state.logout);
  const adminUser = useAdminAuthStore((state) => state.adminUser);
  const location = useLocation();
  const title = titlesByPath[location.pathname] ?? 'Laos Admin';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Laos Admin</h1>
        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <Button variant="ghost" onClick={logout}>
          <LogOut size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Çıkış Yap
        </Button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <h2>{title}</h2>
          {adminUser && <span className="topbar-account">{adminUser.email}</span>}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
