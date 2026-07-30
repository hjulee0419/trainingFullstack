export const category = {
  ko: {
    'category.form.nameLabel': '새 카테고리 이름',
    'category.form.submitting': '추가 중...',
    'category.form.submit': '추가',
    'category.list.empty': '등록된 카테고리가 없습니다.',
    'category.row.defaultCaption': '(삭제 불가·수정 불가)',
    'category.row.deleteConfirm':
      "'{name}' 카테고리를 삭제하시겠습니까? 이 카테고리에 속한 할일은 '기본' 카테고리로 자동 이동됩니다.",
    'category.page.backLink': '← 목록으로',
    'category.page.title': '카테고리 관리',
  },
  en: {
    'category.form.nameLabel': 'New category name',
    'category.form.submitting': 'Adding...',
    'category.form.submit': 'Add',
    'category.list.empty': 'No categories yet.',
    'category.row.defaultCaption': '(Cannot delete or edit)',
    'category.row.deleteConfirm':
      "Are you sure you want to delete the '{name}' category? Todos in this category will be automatically moved to the 'Default' category.",
    'category.page.backLink': '← Back to list',
    'category.page.title': 'Manage Categories',
  },
} as const;
