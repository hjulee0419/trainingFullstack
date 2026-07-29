-- 정책: 사용자별 기본(is_default=true) 카테고리 시딩은 이 마이그레이션이 담당하지 않는다.
-- 이유: 마이그레이션 시딩은 실행 시점에 존재하는 사용자에게만 적용되고,
-- 이후 가입하는 신규 사용자에게는 적용되지 않는다.
-- 기본 카테고리 생성은 회원가입 API 트랜잭션(BE-2, services/auth.service.js)에서 처리한다.
-- 참조: docs/7-execution-plan.md DB-3 절.

-- Up Migration

CREATE TABLE categories (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       VARCHAR(50)  NOT NULL,
    is_default BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- 도메인 정의서 규칙: 사용자별 카테고리 이름 중복 불허(FR-8)
    CONSTRAINT uq_categories_user_id_name UNIQUE (user_id, name)
);

-- 사용자당 '기본' 카테고리는 정확히 1개만 존재해야 한다 (부분 유니크 인덱스)
CREATE UNIQUE INDEX uq_categories_user_id_default
    ON categories (user_id)
    WHERE is_default;

-- Down Migration

DROP TABLE IF EXISTS categories;
