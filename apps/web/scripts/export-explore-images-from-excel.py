"""
[INPUT]: 依赖 Python 标准库 zipfile/re/xml/json/hashlib/pathlib，与 WPS DISPIMG + cellimages 关系映射
[OUTPUT]: 对外提供 Excel 嵌入图片导出与 Explore manifest 生成能力，包含图片导出、文本列解析、Use case 分类映射、虚假作者分配
[POS]: scripts 的稳定 Excel 导出器，被 export-explore-images-from-excel.mjs 包装调用，负责把单元格嵌入图片与元数据还原为项目可导入资产
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path


USE_CASE_CATEGORY_MAP = {
    "Design": {"id": "cat_design", "slug": "design"},
    "Photography": {"id": "cat_photography", "slug": "photography"},
    "Concept Art": {"id": "cat_concept_art", "slug": "concept-art"},
    "UI / UX": {"id": "cat_ui_ux", "slug": "ui-ux"},
    "Illustration": {"id": "cat_illustration", "slug": "illustration"},
    "Marketing": {"id": "cat_marketing", "slug": "marketing"},
    "Product": {"id": "cat_product", "slug": "product"},
}

FAKE_AUTHOR_NAMES = [
    "Mara Voss",
    "Theo Arden",
    "Lina Vale",
    "Jonah Pike",
    "Iris Sol",
    "Cade Mercer",
    "Nora Quinn",
    "Felix Rowan",
    "Mina Frost",
    "Elias North",
    "Ava Sterling",
    "Damon Cross",
    "Sia Hollow",
    "Noel Hart",
    "Lyra Finch",
    "Kian Wren",
]

FAKE_AUTHOR_BUCKETS = [12, 10, 14, 8, 16, 11, 9, 13, 7, 15, 10, 12, 8, 14, 11, 17]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--manifest")
    parser.add_argument("--workflow-base-dir")
    parser.add_argument("--source-type", default="manual")
    parser.add_argument("--prefix", default="excel-import")
    return parser.parse_args()


def decode_xml_entities(value: str) -> str:
    return (
        value.replace("&quot;", '"')
        .replace("&apos;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&amp;", "&")
    )


def sanitize_file_segment(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return normalized.strip("-")


def parse_shared_strings(xml_text: str) -> list[str]:
    items = re.findall(r"<si\b[\s\S]*?</si>", xml_text)
    results: list[str] = []
    for item in items:
      texts = re.findall(r"<t(?:\s[^>]*)?>([\s\S]*?)</t>", item)
      results.append("".join(decode_xml_entities(text) for text in texts))
    return results


def parse_sheet_rows(sheet_text: str, shared_strings: list[str]) -> list[dict]:
    rows = []
    row_matches = re.findall(r'<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)</row>', sheet_text)
    for row_number_text, row_body in row_matches:
        row_number = int(row_number_text)
        values: dict[str, str] = {}
        for attrs, cell_body in re.findall(r"<c\b([^>]*)>([\s\S]*?)</c>", row_body):
            ref_match = re.search(r'\br="([A-Z]+)\d+"', attrs)
            if not ref_match:
                continue
            column = ref_match.group(1)
            type_match = re.search(r'\bt="([^"]+)"', attrs)
            value_match = re.search(r"<v>([\s\S]*?)</v>", cell_body)
            formula_match = re.search(r"<f[^>]*>([\s\S]*?)</f>", cell_body)
            cell_type = type_match.group(1) if type_match else ""
            if cell_type == "s" and value_match:
                index = int(value_match.group(1))
                values[column] = shared_strings[index] if index < len(shared_strings) else ""
            elif formula_match:
                values[column] = decode_xml_entities(formula_match.group(1))
            elif value_match:
                values[column] = decode_xml_entities(value_match.group(1))
            else:
                values[column] = ""
        rows.append({"row_number": row_number, "values": values})
    return rows


def parse_row_image_ids(sheet_text: str) -> dict[int, str]:
    result: dict[int, str] = {}
    row_matches = re.findall(r'<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)</row>', sheet_text)
    for row_number_text, row_body in row_matches:
        formula_match = re.search(r'<c\b[^>]*r="A\d+"[^>]*>[\s\S]*?<f[^>]*>([\s\S]*?)</f>', row_body)
        image_match = (
            re.search(r'DISPIMG\(&quot;(ID_[^&]+)&quot;,1\)', formula_match.group(1))
            if formula_match
            else None
        )
        if image_match:
            result[int(row_number_text)] = image_match.group(1)
    return result


def parse_cell_image_relations(cell_images_text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    blocks = re.findall(r"<etc:cellImage>([\s\S]*?)</etc:cellImage>", cell_images_text)
    for block in blocks:
        id_match = re.search(r'<xdr:cNvPr\b[^>]*name="(ID_[^"]+)"', block)
        rel_match = re.search(r'<a:blip\b[^>]*r:embed="([^"]+)"', block)
        if id_match and rel_match:
            result[id_match.group(1)] = rel_match.group(1)
    return result


def parse_relationships(rels_text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for rel_id, target in re.findall(r'<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*/>', rels_text):
        result[rel_id] = target
    return result


def resolve_fake_author(index: int) -> str:
    remaining = index
    for bucket_index, bucket_size in enumerate(FAKE_AUTHOR_BUCKETS):
        if remaining < bucket_size:
            return FAKE_AUTHOR_NAMES[bucket_index]
        remaining -= bucket_size
    return FAKE_AUTHOR_NAMES[-1]


def build_manifest_item(
    row: dict,
    media_path: Path,
    workflow_json_path: str,
    source_type: str,
    prefix: str,
    author_name: str,
) -> dict:
    title = str(row["values"].get("B", "")).strip()
    prompt = str(row["values"].get("C", "")).strip()
    use_case = str(row["values"].get("D", "")).strip()
    category = USE_CASE_CATEGORY_MAP.get(use_case, {"id": "cat_other", "slug": "other"})
    import_seed = f"{prefix}:{row['row_number']}:{title}:{workflow_json_path}:{author_name}"
    import_key = hashlib.sha1(import_seed.encode("utf-8")).hexdigest()

    return {
        "title": title,
        "description": use_case,
        "prompt": prompt,
        "sourceUrl": "",
        "sourceType": source_type,
        "sourceAuthorName": author_name,
        "sourceAuthorAvatar": "",
        "mediaPath": str(media_path),
        "thumbnailPath": str(media_path),
        "workflowJsonPath": workflow_json_path,
        "mediaType": "image",
        "workflowId": "",
        "categoryId": category["id"],
        "categorySlug": category["slug"],
        "publishedAt": "",
        "isPublic": True,
        "importKey": import_key,
    }


def main() -> None:
    args = parse_args()
    excel_path = Path(args.excel).resolve()
    output_dir = Path(args.output_dir).resolve()
    manifest_path = Path(args.manifest).resolve() if args.manifest else output_dir / "explore-import-manifest.generated.json"
    workflow_base_dir = Path(args.workflow_base_dir).resolve() if args.workflow_base_dir else None

    output_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(excel_path) as archive:
        shared_strings_text = archive.read("xl/sharedStrings.xml").decode("utf-8")
        sheet_text = archive.read("xl/worksheets/sheet1.xml").decode("utf-8")
        cell_images_text = archive.read("xl/cellimages.xml").decode("utf-8")
        rels_text = archive.read("xl/_rels/cellimages.xml.rels").decode("utf-8")

        shared_strings = parse_shared_strings(shared_strings_text)
        rows = [row for row in parse_sheet_rows(sheet_text, shared_strings) if row["row_number"] >= 2]
        row_image_ids = parse_row_image_ids(sheet_text)
        image_relations = parse_cell_image_relations(cell_images_text)
        media_relations = parse_relationships(rels_text)

        manifest_items = []
        exported_count = 0

        for content_index, row in enumerate(rows):
            title = str(row["values"].get("B", "")).strip()
            prompt = str(row["values"].get("C", "")).strip()
            if not title and not prompt:
                continue

            image_id = row_image_ids.get(row["row_number"])
            if not image_id:
                raise RuntimeError(f"Missing embedded image ref for row {row['row_number']}")

            relation_id = image_relations.get(image_id)
            if not relation_id:
                raise RuntimeError(f"Missing cell image relation for {image_id}")

            target = media_relations.get(relation_id)
            if not target:
                raise RuntimeError(f"Missing media target for relation {relation_id}")

            zip_media_path = f"xl/{target}" if target.startswith("media/") else f"xl/media/{Path(target).name}"
            media_bytes = archive.read(zip_media_path)
            extension = Path(target).suffix.lower() or ".png"
            file_base = sanitize_file_segment(title) or f"row-{row['row_number']}"
            file_name = f"{content_index + 1:03d}-{file_base}{extension}"
            output_path = output_dir / file_name
            output_path.write_bytes(media_bytes)
            exported_count += 1

            workflow_path_raw = str(row["values"].get("E", "")).strip()
            workflow_json_path = (
                str((workflow_base_dir / Path(workflow_path_raw).name).resolve())
                if workflow_base_dir and workflow_path_raw
                else workflow_path_raw
            )

            author_name = resolve_fake_author(content_index)
            manifest_items.append(
                build_manifest_item(
                    row=row,
                    media_path=output_path,
                    workflow_json_path=workflow_json_path,
                    source_type=args.source_type,
                    prefix=args.prefix,
                    author_name=author_name,
                )
            )

    manifest_path.write_text(json.dumps(manifest_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Exported {exported_count} images to {output_dir}")
    print(f"Generated manifest: {manifest_path}")


if __name__ == "__main__":
    main()
