import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useCreateCategoryMutation } from '@/features/categories/hooks/useCreateCategoryMutation';
import { getErrorMessage } from '@/lib/errorUtils';

export function CategoryForm() {
  const [name, setName] = useState('');
  const createCategoryMutation = useCreateCategoryMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    createCategoryMutation.mutate(
      { name: trimmedName },
      {
        onSuccess: () => {
          setName('');
        },
      },
    );
  }

  return (
    <form className="category-form" onSubmit={handleSubmit} noValidate>
      <div className="category-form__field">
        <Input
          label="새 카테고리 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={
            createCategoryMutation.isError
              ? getErrorMessage(createCategoryMutation.error)
              : undefined
          }
        />
      </div>
      <Button type="submit" disabled={createCategoryMutation.isPending}>
        {createCategoryMutation.isPending ? '추가 중...' : '추가'}
      </Button>
    </form>
  );
}
