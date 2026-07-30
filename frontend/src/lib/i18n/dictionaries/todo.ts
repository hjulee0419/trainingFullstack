export const todo = {
  ko: {
    'todo.status.notStarted': '시작 전',
    'todo.status.inProgress': '진행중',
    'todo.status.completed': '완료',
    'todo.status.overdue': '기한초과',

    'todo.form.titleLabel': '제목 *',
    'todo.form.descriptionLabel': '설명',
    'todo.form.categoryLabel': '카테고리',
    'todo.form.categoryDefaultOption': '선택 안 함(기본 카테고리)',
    'todo.form.saving': '저장 중...',

    'todo.dateRange.startDateLabel': '시작일자 *',
    'todo.dateRange.endDateLabel': '종료일자 *',

    'todo.filter.categoryLabel': '카테고리',
    'todo.filter.statusLabel': '상태',
    'todo.filter.allOption': '전체',
    'todo.filter.newTodoButton': '+ 새 할일',

    'todo.list.empty': '등록된 할일이 없습니다.',

    'todo.item.completeCheckboxLabel': '완료 여부',
    'todo.item.deleteButtonLabel': '할일 삭제',
    'todo.item.completedAtLabel': '완료일시 {datetime}',
    'todo.item.deleteConfirm': "'{title}' 할일을 삭제하시겠습니까?",

    'todo.pagination.ariaLabel': '페이지네이션',
    'todo.pagination.prev': '← 이전',
    'todo.pagination.next': '다음 →',

    'todo.page.listTitle': '할일 목록',
    'todo.page.createTitle': '할일 등록',
    'todo.page.editTitle': '할일 수정',
    'todo.page.backLink': '← 목록으로',
    'todo.page.editNotice': '목록에서 다시 시도해주세요.',
    'todo.page.editNoticeLink': '할일 목록으로 돌아가기',

    'todo.validation.titleRequired': '제목을 입력해주세요.',
    'todo.validation.startDateRequired': '시작일을 입력해주세요.',
    'todo.validation.endDateRequired': '종료일을 입력해주세요.',
    'todo.validation.endDateBeforeStart': '종료일자는 시작일자보다 빠를 수 없습니다.',
  },
  en: {
    'todo.status.notStarted': 'Not Started',
    'todo.status.inProgress': 'In Progress',
    'todo.status.completed': 'Completed',
    'todo.status.overdue': 'Overdue',

    'todo.form.titleLabel': 'Title *',
    'todo.form.descriptionLabel': 'Description',
    'todo.form.categoryLabel': 'Category',
    'todo.form.categoryDefaultOption': 'None (default category)',
    'todo.form.saving': 'Saving...',

    'todo.dateRange.startDateLabel': 'Start Date *',
    'todo.dateRange.endDateLabel': 'End Date *',

    'todo.filter.categoryLabel': 'Category',
    'todo.filter.statusLabel': 'Status',
    'todo.filter.allOption': 'All',
    'todo.filter.newTodoButton': '+ New Todo',

    'todo.list.empty': 'No todos yet.',

    'todo.item.completeCheckboxLabel': 'Mark as complete',
    'todo.item.deleteButtonLabel': 'Delete todo',
    'todo.item.completedAtLabel': 'Completed at {datetime}',
    'todo.item.deleteConfirm': "Are you sure you want to delete the '{title}' todo?",

    'todo.pagination.ariaLabel': 'Pagination',
    'todo.pagination.prev': '← Previous',
    'todo.pagination.next': 'Next →',

    'todo.page.listTitle': 'Todos',
    'todo.page.createTitle': 'Create Todo',
    'todo.page.editTitle': 'Edit Todo',
    'todo.page.backLink': '← Back to list',
    'todo.page.editNotice': 'Please try again from the list.',
    'todo.page.editNoticeLink': 'Back to todo list',

    'todo.validation.titleRequired': 'Please enter a title.',
    'todo.validation.startDateRequired': 'Please enter a start date.',
    'todo.validation.endDateRequired': 'Please enter an end date.',
    'todo.validation.endDateBeforeStart': 'The end date cannot be earlier than the start date.',
  },
} as const;
