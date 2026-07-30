import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel ?? t('common.delete');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel');

  return (
    <Modal open={open} onClose={onCancel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <p
          style={{
            fontSize: 'var(--font-body-size)',
            lineHeight: 'var(--font-body-line-height)',
            color: 'var(--color-gray-900)',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={onCancel}>
            {resolvedCancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
