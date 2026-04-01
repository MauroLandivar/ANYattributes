#!/usr/bin/env python3
"""
ANYattributes Excel Processor
Uses openpyxl to correctly read Apache POI-generated Excel files,
including cell background colors (red=mandatory, blue=optional).
"""

import sys
import json
import os
import zipfile
import xml.etree.ElementTree as ET
from copy import copy

import openpyxl
from openpyxl.styles import Font, PatternFill, Color
from openpyxl.utils import get_column_letter


# ---------------------------------------------------------------------------
# Color utilities
# ---------------------------------------------------------------------------

def argb_to_rgb(argb: str) -> tuple[int, int, int]:
    """Convert 6 or 8-char hex ARGB string to (r, g, b)."""
    argb = argb.strip()
    if len(argb) == 8:
        r = int(argb[2:4], 16)
        g = int(argb[4:6], 16)
        b = int(argb[6:8], 16)
    elif len(argb) == 6:
        r = int(argb[0:2], 16)
        g = int(argb[2:4], 16)
        b = int(argb[4:6], 16)
    else:
        return (0, 0, 0)
    return (r, g, b)


def classify_color(r: int, g: int, b: int) -> str | None:
    """
    Classify an RGB value as 'red', 'blue', 'green', or None.
    Thresholds are intentionally broad to catch shades used by ANYMARKET.
    """
    # Red: clearly dominant red channel
    if r > 160 and g < 120 and b < 120:
        return "red"
    # Blue: clearly dominant blue channel (incl. Excel standard blue #5B9BD5 = 91,155,213)
    if b > 130 and b > r + 30 and b > g - 30:
        return "blue"
    # Green (headers): dominant green
    if g > 150 and g > r + 30 and g > b + 30:
        return "green"
    return None


# Indexed color table (Excel legacy) — 64-entry standard palette
INDEXED_COLORS = {
    2: (255, 0, 0),      # Red
    3: (0, 255, 0),      # Bright green
    4: (0, 0, 255),      # Blue
    5: (255, 255, 0),    # Yellow
    6: (255, 0, 255),    # Magenta
    7: (0, 255, 255),    # Cyan
    10: (128, 0, 0),     # Dark red
    11: (0, 128, 0),     # Dark green
    12: (0, 0, 128),     # Dark blue
    39: (204, 153, 255), # Light purple
    40: (255, 204, 153), # Light peach
    41: (51, 102, 255),  # Medium blue
    42: (51, 153, 102),  # Teal
    43: (255, 255, 153), # Light yellow
    44: (102, 102, 153), # Muted purple
    45: (150, 150, 150), # Gray
    46: (0, 102, 204),   # ANYMARKET-style blue
    # Add more as needed
}


def get_cell_color(cell) -> str | None:
    """Return 'red', 'blue', 'green', or None based on the cell's fill color."""
    try:
        fill = cell.fill
        if fill is None or fill.fill_type in (None, "none"):
            return None

        fg = fill.fgColor

        if fg.type == "rgb":
            argb = fg.rgb or ""
            if not argb or argb in ("00000000", "FFFFFFFF", "FF000000"):
                return None
            r, g, b = argb_to_rgb(argb)
            return classify_color(r, g, b)

        elif fg.type == "indexed":
            idx = fg.indexed
            rgb = INDEXED_COLORS.get(idx)
            if rgb:
                return classify_color(*rgb)

        elif fg.type == "theme":
            # Theme colors require resolving the theme XML — handled below
            return None

    except Exception:
        pass

    return None


def get_cell_color_from_xml(filepath: str) -> dict[str, dict[str, str]]:
    """
    Fallback: directly parse xlsx XML to extract cell fill colors.
    Returns dict: { "sheet_name": { "A1": "red", "B3": "blue", ... } }
    This handles theme colors and edge cases that openpyxl misses.
    """
    result: dict[str, dict[str, str]] = {}

    try:
        with zipfile.ZipFile(filepath) as z:
            names = z.namelist()

            # Parse styles.xml to build xf → fill → color mapping
            styles_xml = z.read("xl/styles.xml")
            styles_root = ET.fromstring(styles_xml)
            ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

            # Extract fills
            fills = []
            fills_elem = styles_root.find("x:fills", ns)
            if fills_elem is not None:
                for fill_elem in fills_elem.findall("x:fill", ns):
                    pf = fill_elem.find("x:patternFill", ns)
                    color = None
                    if pf is not None:
                        fg_elem = pf.find("x:fgColor", ns)
                        if fg_elem is not None:
                            argb = fg_elem.get("rgb", "")
                            theme = fg_elem.get("theme")
                            indexed = fg_elem.get("indexed")
                            if argb and argb not in ("00000000", "FFFFFFFF"):
                                r, g, b = argb_to_rgb(argb)
                                color = classify_color(r, g, b)
                            elif indexed:
                                idx = int(indexed)
                                rgb = INDEXED_COLORS.get(idx)
                                if rgb:
                                    color = classify_color(*rgb)
                    fills.append(color)

            # Extract xfs (cell formats) → fill index
            xfs = []
            cell_xfs = styles_root.find("x:cellXfs", ns)
            if cell_xfs is not None:
                for xf in cell_xfs.findall("x:xf", ns):
                    fill_id = int(xf.get("fillId", 0))
                    apply_fill = xf.get("applyFill", "0")
                    if apply_fill == "1" and fill_id < len(fills):
                        xfs.append(fills[fill_id])
                    else:
                        xfs.append(None)

            # Parse each sheet
            sheet_files = [n for n in names if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")]
            for sheet_file in sheet_files:
                sheet_name = sheet_file
                sheet_colors: dict[str, str] = {}
                sheet_xml = z.read(sheet_file)
                sheet_root = ET.fromstring(sheet_xml)

                for row_elem in sheet_root.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
                    for c_elem in row_elem.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                        ref = c_elem.get("r", "")
                        s_attr = c_elem.get("s")
                        if s_attr is not None:
                            xf_idx = int(s_attr)
                            if xf_idx < len(xfs) and xfs[xf_idx]:
                                sheet_colors[ref] = xfs[xf_idx]

                result[sheet_name] = sheet_colors

    except Exception as e:
        sys.stderr.write(f"XML fallback error: {e}\n")

    return result


# ---------------------------------------------------------------------------
# Data validation helpers
# ---------------------------------------------------------------------------

def extract_dv_options(ws) -> dict[str, list[str]]:
    """
    Extract data validation dropdown options per column letter.
    Returns { "E": ["Option1", "Option2", ...], ... }
    """
    options: dict[str, list[str]] = {}
    try:
        for dv in ws.data_validations.dataValidation:
            if dv.type != "list" or not dv.formula1:
                continue
            formula = dv.formula1.strip('"').strip("'")
            if "!" in formula:
                # Named range or external reference — skip for now
                continue
            opts = [o.strip() for o in formula.replace(";", ",").split(",") if o.strip()]
            if not opts:
                continue
            # Apply to all cells in the validation range
            try:
                for cell_range in dv.sqref.ranges:
                    for col in range(cell_range.min_col, cell_range.max_col + 1):
                        col_letter = get_column_letter(col)
                        if col_letter not in options:
                            options[col_letter] = opts
            except Exception:
                pass
    except Exception:
        pass
    return options


# ---------------------------------------------------------------------------
# Main analysis
# ---------------------------------------------------------------------------

def analyze_file(filepath: str) -> dict:
    """
    Analyze an Excel file and return structured data about empty colored cells.
    """
    # Load with data_only=True to read cached cell values
    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active

    if ws is None:
        raise ValueError("No active worksheet found")

    max_col = ws.max_column or 0
    max_row = ws.max_row or 0

    # --- Build XML fallback color map (for theme/indexed colors) ---
    xml_colors = get_cell_color_from_xml(filepath)
    # Use the first sheet's XML colors as fallback
    xml_sheet_colors: dict[str, str] = {}
    if xml_colors:
        first_key = next(iter(xml_colors))
        xml_sheet_colors = xml_colors[first_key]

    def resolve_color(cell) -> str | None:
        color = get_cell_color(cell)
        if color is None:
            # Try XML fallback
            cell_ref = f"{get_column_letter(cell.column)}{cell.row}"
            color = xml_sheet_colors.get(cell_ref)
        return color

    # --- Read column headers (rows 1-4) ---
    headers: dict[str, dict] = {}
    for col in range(5, max_col + 1):
        col_letter = get_column_letter(col)
        name = ws.cell(row=1, column=col).value
        marketplace = ws.cell(row=2, column=col).value
        data_type = ws.cell(row=3, column=col).value
        dropdown_label = ws.cell(row=4, column=col).value
        if name or marketplace:
            headers[col_letter] = {
                "name": str(name) if name is not None else "",
                "marketplace": str(marketplace) if marketplace is not None else "",
                "data_type": str(data_type) if data_type is not None else "",
                "dropdown_label": str(dropdown_label) if dropdown_label is not None else "",
            }

    # --- Extract data validation options ---
    dv_options = extract_dv_options(ws)

    # Parse dropdown labels as fallback options (e.g. "Opt1;Opt2;Opt3")
    label_options: dict[str, list[str]] = {}
    for col_letter, hdr in headers.items():
        label = hdr.get("dropdown_label", "")
        if label and (";" in label or "," in label):
            opts = [o.strip() for o in label.replace(";", ",").split(",") if o.strip()]
            if len(opts) > 1:
                label_options[col_letter] = opts

    def get_options(col_letter: str) -> list[str]:
        if col_letter in dv_options:
            return dv_options[col_letter]
        if col_letter in label_options:
            return label_options[col_letter]
        return []

    # --- Scan data rows (row 5+) ---
    cells_to_fill: list[dict] = []
    total_products = 0
    red_cells_empty = 0
    blue_cells_empty = 0

    for row in range(5, max_row + 1):
        product_id_cell = ws.cell(row=row, column=1)
        product_id = product_id_cell.value
        if product_id is None or str(product_id).strip() == "":
            continue

        total_products += 1
        product_name = ws.cell(row=row, column=2).value
        category = ws.cell(row=row, column=3).value
        skus = ws.cell(row=row, column=4).value

        for col in range(5, max_col + 1):
            cell = ws.cell(row=row, column=col)
            col_letter = get_column_letter(col)

            if col_letter not in headers:
                continue

            color = resolve_color(cell)

            if color not in ("red", "blue"):
                continue

            # Only process empty cells
            cell_value = cell.value
            if cell_value is not None and str(cell_value).strip() != "":
                continue

            hdr = headers[col_letter]
            if color == "red":
                red_cells_empty += 1
            else:
                blue_cells_empty += 1

            cells_to_fill.append({
                "row": row,
                "col": col,
                "col_letter": col_letter,
                "product_id": str(product_id),
                "product_name": str(product_name) if product_name is not None else "",
                "category": str(category) if category is not None else "",
                "skus": str(skus) if skus is not None else "",
                "attribute_name": hdr["name"],
                "marketplace": hdr["marketplace"],
                "data_type": hdr["data_type"],
                "dropdown_label": hdr["dropdown_label"],
                "options": get_options(col_letter),
                "color": color,
            })

    wb.close()

    return {
        "total_products": total_products,
        "red_cells_empty": red_cells_empty,
        "blue_cells_empty": blue_cells_empty,
        "headers": headers,
        "cells": cells_to_fill,
        "filename": os.path.basename(filepath),
    }


# ---------------------------------------------------------------------------
# Write filled values
# ---------------------------------------------------------------------------

def write_file(source_filepath: str, cells_data: list[dict], output_filepath: str) -> None:
    """
    Write AI-generated values to empty cells and save the file.
    - Preserves all original formatting (colors, dropdowns, validations)
    - Changes font color to WHITE on filled cells to indicate AI completion
    - Keeps background color intact
    """
    # Load without data_only to preserve formulas in existing cells
    wb = openpyxl.load_workbook(source_filepath)
    ws = wb.active

    if ws is None:
        raise ValueError("No active worksheet found")

    for item in cells_data:
        row = item["row"]
        col = item["col"]
        value = item.get("value")

        if value is None or str(value).strip() == "":
            continue

        cell = ws.cell(row=row, column=col)

        # Write the value
        data_type = item.get("data_type", "").lower()
        if data_type == "numero":
            try:
                cell.value = float(str(value).replace(",", "."))
            except (ValueError, TypeError):
                cell.value = value
        else:
            cell.value = str(value)

        # Set font color to white (preserve other font properties)
        existing_font = cell.font
        cell.font = Font(
            name=existing_font.name,
            size=existing_font.size,
            bold=existing_font.bold,
            italic=existing_font.italic,
            underline=existing_font.underline,
            strike=existing_font.strike,
            color="FFFFFFFF",  # White — signals AI-filled
        )

    wb.save(output_filepath)
    wb.close()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: excel_processor.py <analyze|write> [args]"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "analyze":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Usage: analyze <filepath>"}))
            sys.exit(1)
        filepath = sys.argv[2]
        if not os.path.exists(filepath):
            print(json.dumps({"error": f"File not found: {filepath}"}))
            sys.exit(1)
        try:
            result = analyze_file(filepath)
            print(json.dumps(result, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

    elif command == "write":
        if len(sys.argv) < 5:
            print(json.dumps({"error": "Usage: write <source> <cells_json_file> <output>"}))
            sys.exit(1)
        source = sys.argv[2]
        cells_json_path = sys.argv[3]
        output = sys.argv[4]
        if not os.path.exists(source):
            print(json.dumps({"error": f"Source file not found: {source}"}))
            sys.exit(1)
        try:
            with open(cells_json_path, encoding="utf-8") as f:
                cells_data = json.load(f)
            write_file(source, cells_data, output)
            print(json.dumps({"success": True, "output": output}))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)
