-- Up Migration

CREATE TABLE todos (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id  BIGINT       NOT NULL REFERENCES categories (id), -- ON DELETE 미지정(기본 RESTRICT): 카테고리 삭제 전 소속 todos를 '기본' 카테고리로 재할당하는 트랜잭션을 애플리케이션이 강제하도록 함
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    start_date   DATE         NOT NULL,
    end_date     DATE         NOT NULL,
    is_completed BOOLEAN      NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- 도메인 정의서 규칙 3: 종료일자는 시작일자보다 이전일 수 없다(같은 날짜 허용)
    CONSTRAINT ck_todos_end_date_after_start CHECK (end_date >= start_date)
);

-- status(시작전/진행중/완료/기한초과)는 저장 컬럼이 아니다.
-- is_completed, start_date, end_date(완료 시 completed_at)로부터
-- 조회 시점에 애플리케이션(Service) 레벨에서 계산되는 파생값이다.

-- 목록 조회/필터(카테고리+상태 AND, PRD FR-5) 성능을 위한 인덱스 (PRD 6.1 반영)
CREATE INDEX idx_todos_user_id_category_id   ON todos (user_id, category_id);
CREATE INDEX idx_todos_user_id_is_completed  ON todos (user_id, is_completed);
CREATE INDEX idx_todos_user_id_end_date      ON todos (user_id, end_date);

-- Down Migration

DROP TABLE IF EXISTS todos;
