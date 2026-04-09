from __future__ import annotations

import csv
import io
from collections.abc import Iterable, Iterator

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


def render_csv_chunk(
    *,
    rows: Iterable[list[object]],
    headers: list[str] | None = None,
    include_bom: bool = False,
) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)

    if headers is not None:
        writer.writerow(headers)

    for row in rows:
        writer.writerow([sanitize_csv_cell(cell) for cell in row])

    encoded = buffer.getvalue().encode("utf-8")
    if include_bom:
        return b"\xef\xbb\xbf" + encoded

    return encoded


def iter_csv_bytes(
    *,
    headers: list[str],
    row_batches: Iterable[Iterable[list[object]]],
) -> Iterator[bytes]:
    yield render_csv_chunk(headers=headers, rows=(), include_bom=True)
    for batch in row_batches:
        chunk = render_csv_chunk(rows=batch)
        if chunk:
            yield chunk
