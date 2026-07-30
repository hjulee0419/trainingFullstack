import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    useAuthStore.getState().clearToken();
    setIsOpen(false);
    navigate('/login');
  }

  return (
    <div className="user-menu" ref={containerRef}>
      <button type="button" className="user-menu__trigger" onClick={() => setIsOpen((prev) => !prev)}>
        {user?.nickname ?? ''} ▾
      </button>
      {isOpen && (
        <div className="user-menu__dropdown">
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
