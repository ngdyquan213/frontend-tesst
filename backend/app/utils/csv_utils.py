from __future__ import annotations

import csv
import io

DANGEROUS_CSV_PREFIXES = ("=", "+", "-", "@")


def sanitize_csv_cell(value: object) -> object:
    if not isinstance(value, str):
        return value

    stripped_value = value.lstrip(" \t\r\n")
    if stripped_value.startswith(DANGEROUS_CSV_PREFIXES):
        return f"'{value}"

    return value


def build_csv_bytes(headers: list[str], rows: list[list[object]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow(headers)
    for row in rows:
        writer.writerow([sanitize_csv_cell(cell) for cell in row])

    return buffer.getvalue().encode("utf-8-sig")
