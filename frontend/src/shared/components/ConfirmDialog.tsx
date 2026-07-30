import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';

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
  confirmLabel = '삭제',
  cancelLabel = '취소',
}: ConfirmDialogProps) {
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
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
