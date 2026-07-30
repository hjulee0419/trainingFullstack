import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { NicknameForm } from '@/features/account/components/NicknameForm';
import { PasswordForm } from '@/features/account/components/PasswordForm';

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;

  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AccountPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="account-page">
      <Link to="/todos" className="account-page__back-link">
        ← 목록으로
      </Link>
      <h1 className="account-page__title">내 정보</h1>

      <section className="account-page__section">
        <div className="account-page__field">
          <span className="account-page__field-label">이메일</span>
          <span className="account-page__field-value">{user.email}</span>
        </div>
        <div className="account-page__field">
          <span className="account-page__field-label">닉네임</span>
          <span className="account-page__field-value">{user.nickname}</span>
        </div>
        <div className="account-page__field">
          <span className="account-page__field-label">가입일시</span>
          <span className="account-page__field-value">{formatCreatedAt(user.createdAt)}</span>
        </div>
      </section>

      <section className="account-page__section">
        <h2 className="account-page__subtitle">닉네임 변경</h2>
        <NicknameForm initialNickname={user.nickname} />
      </section>

      <section className="account-page__section">
        <h2 className="account-page__subtitle">비밀번호 변경</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
