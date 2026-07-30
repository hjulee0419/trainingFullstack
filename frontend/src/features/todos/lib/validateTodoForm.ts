export interface TodoFormValues {
  title: string;
  description: string;
  categoryId: string;
  startDate: string;
  endDate: string;
}

export interface TodoFormErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
}

export function validateTodoForm(values: TodoFormValues): TodoFormErrors {
  const errors: TodoFormErrors = {};
  if (!values.title.trim()) errors.title = '제목을 입력해주세요.';
  if (!values.startDate) errors.startDate = '시작일을 입력해주세요.';
  if (!values.endDate) errors.endDate = '종료일을 입력해주세요.';
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = '종료일자는 시작일자보다 빠를 수 없습니다.'; // E-1
  }
  return errors;
}
