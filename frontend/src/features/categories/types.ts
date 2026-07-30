export interface Category {
  // 백엔드가 BIGINT 컬럼을 JSON에서 문자열로 반환하므로(정밀도 손실 방지) 숫자가 아닌
  // 불투명한 식별자 문자열로 다룬다. 산술 연산에 쓰지 말 것 — URL 경로/비교에만 사용.
  id: string;
  name: string;
  isDefault: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}
