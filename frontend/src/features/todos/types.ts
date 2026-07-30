export type TodoStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface Todo {
  // 백엔드가 BIGINT 컬럼을 JSON에서 문자열로 반환하므로(정밀도 손실 방지) 숫자가 아닌
  // 불투명한 식별자 문자열로 다룬다. 산술 연산에 쓰지 말 것 — URL 경로/비교에만 사용.
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  isCompleted: boolean;
  completedAt: string | null;
  status: TodoStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface TodoListResponse {
  items: Todo[];
  pagination: PaginationMeta;
}

export interface TodoFilterParams {
  categoryId?: string;
  status?: TodoStatus;
  page: number;
  limit: number;
}
