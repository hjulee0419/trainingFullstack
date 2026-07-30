import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useUpdateCategoryMutation } from '@/features/categories/hooks/useUpdateCategoryMutation';
import { useDeleteCategoryMutation } from '@/features/categories/hooks/useDeleteCategoryMutation';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Category } from '@/features/categories/types';

interface CategoryRowProps {
  category: Category;
}

export function CategoryRow({ category }: CategoryRowProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();

  function handleEditStart() {
    setEditName(category.name);
    setIsEditing(true);
  }

  function handleEditCancel() {
    setIsEditing(false);
    updateCategoryMutation.reset();
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = editName.trim();
    if (!trimmedName) return;

    updateCategoryMutation.mutate(
      { id: category.id, req: { name: trimmedName } },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }

  function handleDeleteConfirm() {
    deleteCategoryMutation.mutate(category.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  }

  if (isEditing) {
    return (
      <li className="category-row category-row--editing">
        <form className="category-row__edit-form" onSubmit={handleEditSubmit} noValidate>
          <div className="category-row__edit-field">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              error={
                updateCategoryMutation.isError
                  ? getErrorMessage(updateCategoryMutation.error)
                  : undefined
              }
            />
          </div>
          <div className="category-row__actions">
            <Button type="submit" disabled={updateCategoryMutation.isPending}>
              {t('common.save')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEditCancel}
              disabled={updateCategoryMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="category-row">
      <span className="category-row__name">{category.name}</span>
      {category.isDefault ? (
        <span className="category-row__caption">{t('category.row.defaultCaption')}</span>
      ) : (
        <div className="category-row__actions">
          <Button variant="secondary" onClick={handleEditStart}>
            {t('common.edit')}
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteDialogOpen(true)}>
            {t('common.delete')}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        message={t('category.row.deleteConfirm', { name: category.name })}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </li>
  );
}
