# Contributing

## Local Setup

1. Tạo virtual environment.
2. Cài dependencies:

```bash
pip install -r requirements-dev.lock
pip install --no-deps -e .
```

3. Copy `.env.example` thành `.env` nếu cần chạy local stack.

## Quality Gates

Trước khi mở PR hoặc merge local, chạy tối thiểu:

```bash
pip check
ruff check app tests scripts
bandit -r app -x tests
pip-audit
python -m pytest -q
python -m pytest --cov=app --cov-report=term-missing -q
```

## Migrations

- Dùng Alembic cho mọi thay đổi schema.
- Kiểm tra `alembic upgrade head` trên database trống trước khi merge.
- Với migration khó rollback, ghi rõ trong PR và trong runbook.

## Documentation

- Cập nhật docs khi thay đổi API contract, env vars hoặc rollout flow.
- Ưu tiên UTF-8 sạch cho tài liệu tiếng Việt.

## Git Hygiene

- Không commit `.env`, secrets hoặc dữ liệu upload thật.
- Không revert thay đổi không liên quan của người khác.
- Giữ commit message rõ ý, theo thay đổi thực tế.
