import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { UserMenu } from '@/shared/layout/UserMenu';

const navItems = [
  { to: '/todos', label: '할일 목록' },
  { to: '/categories', label: '카테고리' },
  { to: '/account', label: '계정' },
];

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div>
      <header className="gnb">
        <div className="gnb-left">
          <NavLink to="/todos" className="gnb-logo">
            TodoList
          </NavLink>
          <nav className="gnb-desktop-menu">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <UserMenu />
        <button
          type="button"
          className="gnb-mobile-toggle"
          aria-label="메뉴 열기"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          ☰
        </button>
        <nav className={`gnb-mobile-menu${isMobileMenuOpen ? ' is-open' : ''}`}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={closeMobileMenu}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
