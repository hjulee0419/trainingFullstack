import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useUpdateCategoryMutation } from '@/features/categories/hooks/useUpdateCategoryMutation';
import { useDeleteCategoryMutation } from '@/features/categories/hooks/useDeleteCategoryMutation';
import { getErrorMessage } from '@/lib/errorUtils';
import type { Category } from '@/features/categories/types';

interface CategoryRowProps {
  category: Category;
}

export function CategoryRow({ category }: CategoryRowProps) {
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
              저장
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleEditCancel}
              disabled={updateCategoryMutation.isPending}
            >
              취소
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
        <span className="category-row__caption">(삭제 불가·수정 불가)</span>
      ) : (
        <div className="category-row__actions">
          <Button variant="secondary" onClick={handleEditStart}>
            수정
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteDialogOpen(true)}>
            삭제
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        message={`'${category.name}' 카테고리를 삭제하시겠습니까? 이 카테고리에 속한 할일은 '기본' 카테고리로 자동 이동됩니다.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </li>
  );
}
