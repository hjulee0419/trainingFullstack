import { Button } from '@/shared/components/Button';
import { TodoStatusBadge } from '@/features/todos/components/TodoStatusBadge';
import { useStatusDisplayStore } from '@/features/todos/store/useStatusDisplayStore';
import { useStatusDisplay } from '@/features/todos/hooks/useStatusDisplay';
import { STATUS_ORDER, defaultStatusColorHex } from '@/features/todos/lib/statusDisplayDefaults';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TodoStatus } from '@/features/todos/types';

function StatusDisplayRow({ status }: { status: TodoStatus }) {
  const { t } = useTranslation();
  const { label, color } = useStatusDisplay(status);
  const setLabel = useStatusDisplayStore((state) => state.setLabel);
  const setColor = useStatusDisplayStore((state) => state.setColor);
  const resetStatus = useStatusDisplayStore((state) => state.resetStatus);
  const customLabel = useStatusDisplayStore((state) => state.labels[status]);
  const customColor = useStatusDisplayStore((state) => state.colors[status]);
  const defaultHex = defaultStatusColorHex[status];

  return (
    <div className="status-settings__row">
      <TodoStatusBadge status={status} />
      <input
        type="text"
        className="status-settings__label-input"
        aria-label={t('todo.statusSettings.labelInputLabel', { label })}
        value={customLabel ?? ''}
        placeholder={label}
        onChange={(e) => setLabel(status, e.target.value)}
      />
      <input
        type="color"
        aria-label={t('todo.statusSettings.bgColorInputLabel', { label })}
        value={customColor?.bg ?? defaultHex.bg}
        onChange={(e) => setColor(status, { bg: e.target.value, text: color.text })}
      />
      <input
        type="color"
        aria-label={t('todo.statusSettings.textColorInputLabel', { label })}
        value={customColor?.text ?? defaultHex.text}
        onChange={(e) => setColor(status, { bg: color.bg, text: e.target.value })}
      />
      <Button variant="secondary" type="button" onClick={() => resetStatus(status)}>
        {t('todo.statusSettings.resetOne')}
      </Button>
    </div>
  );
}

export function StatusDisplaySettings() {
  const { t } = useTranslation();
  const resetAll = useStatusDisplayStore((state) => state.resetAll);

  return (
    <div className="status-settings">
      {STATUS_ORDER.map((status) => (
        <StatusDisplayRow key={status} status={status} />
      ))}
      <Button variant="secondary" type="button" onClick={resetAll}>
        {t('todo.statusSettings.resetAll')}
      </Button>
    </div>
  );
}
