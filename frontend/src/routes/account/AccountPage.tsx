import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { NicknameForm } from '@/features/account/components/NicknameForm';
import { PasswordForm } from '@/features/account/components/PasswordForm';
import { StatusDisplaySettings } from '@/features/todos/components/StatusDisplaySettings';
import { useTranslation } from '@/lib/i18n/useTranslation';

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;

  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AccountPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="account-page">
      <Link to="/todos" className="account-page__back-link">
        {t('account.page.backLink')}
      </Link>
      <h1 className="account-page__title">{t('account.page.title')}</h1>

      <section className="account-page__section">
        <div className="account-page__field">
          <span className="account-page__field-label">{t('account.page.email')}</span>
          <span className="account-page__field-value">{user.email}</span>
        </div>
        <div className="account-page__field">
          <span className="account-page__field-label">{t('account.page.nickname')}</span>
          <span className="account-page__field-value">{user.nickname}</span>
        </div>
        <div className="account-page__field">
          <span className="account-page__field-label">{t('account.page.createdAt')}</span>
          <span className="account-page__field-value">{formatCreatedAt(user.createdAt)}</span>
        </div>
      </section>

      <section className="account-page__section">
        <h2 className="account-page__subtitle">{t('account.page.nicknameSectionTitle')}</h2>
        <NicknameForm initialNickname={user.nickname} />
      </section>

      <section className="account-page__section">
        <h2 className="account-page__subtitle">{t('account.page.passwordSectionTitle')}</h2>
        <PasswordForm />
      </section>

      <section className="account-page__section">
        <h2 className="account-page__subtitle">{t('todo.statusSettings.title')}</h2>
        <p className="account-page__field-label">{t('todo.statusSettings.description')}</p>
        <StatusDisplaySettings />
      </section>
    </div>
  );
}
