import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { UserMenu } from '@/shared/layout/UserMenu';
import { ThemeToggle } from '@/shared/layout/ThemeToggle';
import { LocaleToggle } from '@/shared/layout/LocaleToggle';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { to: '/todos', label: t('common.nav.todos') },
    { to: '/categories', label: t('common.nav.categories') },
    { to: '/account', label: t('common.nav.account') },
  ];

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
        <div className="gnb-right">
          <LocaleToggle />
          <ThemeToggle />
          <UserMenu />
        </div>
        <button
          type="button"
          className="gnb-mobile-toggle"
          aria-label={t('common.nav.openMenu')}
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
