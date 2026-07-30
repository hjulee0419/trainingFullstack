import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { DateRangePicker } from '@/features/todos/components/DateRangePicker';
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery';
import { validateTodoForm, type TodoFormErrors, type TodoFormValues } from '@/features/todos/lib/validateTodoForm';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';

const emptyValues: TodoFormValues = {
  title: '',
  description: '',
  categoryId: '',
  startDate: '',
  endDate: '',
};

interface TodoFormProps {
  mode: 'create' | 'edit';
  initialValues?: TodoFormValues;
  onSubmit: (values: TodoFormValues) => void;
  isSubmitting: boolean;
  submitError?: unknown;
}

export function TodoForm({ mode, initialValues, onSubmit, isSubmitting, submitError }: TodoFormProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: categories } = useCategoriesQuery();
  const [values, setValues] = useState<TodoFormValues>(initialValues ?? emptyValues);
  const [errors, setErrors] = useState<TodoFormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateTodoForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit(values);
  }

  return (
    <form className="todo-form" data-mode={mode} onSubmit={handleSubmit} noValidate>
      {submitError !== undefined && submitError !== null && (
        <ErrorMessage message={getErrorMessage(submitError)} />
      )}

      <div className="todo-form__field">
        <Input
          label={t('todo.form.titleLabel')}
          value={values.title}
          onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
          error={errors.title}
        />
      </div>

      <div className="todo-form__field">
        <label htmlFor="todo-description" className="todo-form__label">
          {t('todo.form.descriptionLabel')}
        </label>
        <textarea
          id="todo-description"
          className="todo-form__textarea"
          value={values.description}
          onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="todo-form__field">
        <label htmlFor="todo-category" className="todo-form__label">
          {t('todo.form.categoryLabel')}
        </label>
        <select
          id="todo-category"
          className="todo-form__select"
          value={values.categoryId}
          onChange={(e) => setValues((prev) => ({ ...prev, categoryId: e.target.value }))}
        >
          <option value="">{t('todo.form.categoryDefaultOption')}</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <DateRangePicker
        startDate={values.startDate}
        endDate={values.endDate}
        onStartDateChange={(value) => setValues((prev) => ({ ...prev, startDate: value }))}
        onEndDateChange={(value) => setValues((prev) => ({ ...prev, endDate: value }))}
        errors={{ startDate: errors.startDate, endDate: errors.endDate }}
      />

      <div className="todo-form__actions">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('todo.form.saving') : t('common.save')}
        </Button>
        <Button variant="secondary" type="button" onClick={() => navigate('/todos')}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

