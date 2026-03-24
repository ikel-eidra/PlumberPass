from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import fitz

REPO_ROOT = Path(__file__).resolve().parent.parent
MATERIALS_ROOT = REPO_ROOT.parent / "materials"
OUTPUT_ASSET_DIR = REPO_ROOT / "frontend" / "public" / "visual-review"
OUTPUT_DATA_PATH = REPO_ROOT / "backend" / "data" / "published" / "visual_review_items.json"


VISUAL_MANIFEST: list[dict[str, Any]] = [
    {
        "id": "visual__fundamentals-square",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Study the illustration, then name the figure before checking the answer.",
        "answer": "Square",
        "accepted_answers": ["square"],
        "caption": "Figure 1-1 Square",
        "image_alt": "Square diagram labeled with base b and height h.",
        "difficulty": 1,
        "explanation_short": "This is the square figure paired with the basic area relation A = bh.",
        "explanation_long": "Use this card to lock in the visual shape and the way the formulas chapter labels the square before moving to similar four-sided figures.",
        "tags": ["visual-review", "geometry", "figure-1-1-square", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.21 | Figure 1 1 Square",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-square.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 21,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-1 Square", "Figure 1 1 Square"],
            "pick": "lowest",
            "margins": {"left": 78, "right": 52, "top": 102, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-rhombus",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Look at the drawing and identify the geometry figure.",
        "answer": "Rhombus",
        "accepted_answers": ["rhombus"],
        "caption": "Figure 1-3 Rhombus",
        "image_alt": "Rhombus diagram labeled with base b and height h.",
        "difficulty": 1,
        "explanation_short": "The slanted four-sided figure is a rhombus.",
        "explanation_long": "This card helps separate the rhombus from the rectangle-like and trapezium figures shown on the same reference page.",
        "tags": ["visual-review", "geometry", "figure-1-3-rhombus", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.22 | Figure 1 3 Rhombus",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-rhombus.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 22,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-3 Rhombus", "Figure 1 3 Rhombus"],
            "pick": "lowest",
            "margins": {"left": 72, "right": 84, "top": 118, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-trapezium",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Identify the figure shown in the illustration.",
        "answer": "Trapezium",
        "accepted_answers": ["trapezium"],
        "caption": "Figure 1-6 Trapezium",
        "image_alt": "Trapezium diagram labeled with a, b, c, H, and h dimensions.",
        "difficulty": 2,
        "explanation_short": "The illustrated figure is a trapezium.",
        "explanation_long": "Focus on the unequal top and bottom spans and the extra side labels used in the formulas page to distinguish the trapezium from simpler quadrilaterals.",
        "tags": ["visual-review", "geometry", "figure-1-6-trapezium", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.22 | Figure 1 6 Trapezium",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-trapezium.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 22,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-6 Trapezium", "Figure 1 6 Trapezium"],
            "pick": "lowest",
            "margins": {"left": 82, "right": 86, "top": 146, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-right-angle-triangle",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Name the triangle shown in this figure.",
        "answer": "Right-Angle Triangle",
        "accepted_answers": ["right-angle triangle", "right angle triangle", "right triangle"],
        "caption": "Figure 1-7 Right-Angle Triangle",
        "image_alt": "Right-angle triangle diagram labeled with base b and height h.",
        "difficulty": 1,
        "explanation_short": "The vertical and horizontal sides identify a right-angle triangle.",
        "explanation_long": "This card is for quick visual separation of the right-angle triangle from the isosceles triangle that appears immediately below it.",
        "tags": ["visual-review", "geometry", "figure-1-7-right-angle-triangle", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.22 | Figure 1 7 Right Angle Triangle",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-right-angle-triangle.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 22,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-7 Right-Angle Triangle", "Figure 1 7 Right Angle Triangle"],
            "pick": "lowest",
            "margins": {"left": 78, "right": 94, "top": 105, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-isosceles-triangle",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Study the drawing and identify the triangle type.",
        "answer": "Isosceles Triangle",
        "accepted_answers": ["isosceles triangle", "isosceles"],
        "caption": "Figure 1-8 Isosceles Triangle",
        "image_alt": "Isosceles triangle diagram labeled with base b and height h.",
        "difficulty": 1,
        "explanation_short": "The centered apex and matching sloped sides mark it as an isosceles triangle.",
        "explanation_long": "Use this visual to quickly separate the isosceles-triangle profile from the right-angle triangle on the same formulas page.",
        "tags": ["visual-review", "geometry", "figure-1-8-isosceles-triangle", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.22 | Figure 1 8 Isosceles Triangle",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-isosceles-triangle.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 22,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-8 Isosceles Triangle", "Figure 1 8 Isosceles Triangle"],
            "pick": "lowest",
            "margins": {"left": 74, "right": 82, "top": 102, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-cylinder",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Identify the three-dimensional figure shown.",
        "answer": "Cylinder",
        "accepted_answers": ["cylinder"],
        "caption": "Figure 1-10 Cylinder",
        "image_alt": "Cylinder diagram labeled with diameter D and height h.",
        "difficulty": 1,
        "explanation_short": "The figure is a cylinder with diameter and height labels.",
        "explanation_long": "This card builds quick recognition of the cylinder drawing used with surface-area and volume relations in the arithmetic reference.",
        "tags": ["visual-review", "geometry", "figure-1-10-cylinder", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.22 | Figure 1 10 Cylinder",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-cylinder.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 22,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-10 Cylinder", "Figure 1 10 Cylinder"],
            "pick": "lowest",
            "margins": {"left": 72, "right": 76, "top": 116, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-cone",
        "topic": "Plumbing Arithmetic",
        "subtopic": "Formulas and Figures",
        "prompt": "Name the illustrated solid figure.",
        "answer": "Cone",
        "accepted_answers": ["cone"],
        "caption": "Figure 1-13 Cone",
        "image_alt": "Cone diagram labeled with height h, base diameter b, and slant height s.",
        "difficulty": 1,
        "explanation_short": "The tapering sides and circular base identify a cone.",
        "explanation_long": "This card sharpens recognition of the cone against the cylinder and pyramid figures found in the same formulas sequence.",
        "tags": ["visual-review", "geometry", "figure-1-13-cone", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.22 | Figure 1 13 Cone",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-cone.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 22,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-13 Cone", "Figure 1 13 Cone"],
            "pick": "lowest",
            "margins": {"left": 78, "right": 82, "top": 118, "bottom": 24},
        },
    },
    {
        "id": "visual__fundamentals-pipe-sleeve-floor-penetration",
        "topic": "Sanitation, Plumbing Design and Installation",
        "subtopic": "Acoustics in Plumbing Systems",
        "prompt": "Study the detail drawing, then name the plumbing acoustics figure.",
        "answer": "Pipe-Sleeve Floor Penetration",
        "accepted_answers": ["pipe-sleeve floor penetration", "pipe sleeve floor penetration"],
        "caption": "Figure 10-1 Pipe-Sleeve Floor Penetration",
        "image_alt": "Plumbing detail showing a pipe-sleeve floor penetration through a slab.",
        "difficulty": 2,
        "explanation_short": "This figure shows a pipe-sleeve floor penetration detail.",
        "explanation_long": "The cue is the pipe crossing the floor slab with resilient mounting and sleeve treatment identified around the penetration.",
        "tags": ["visual-review", "acoustics", "figure-10-1-pipe-sleeve-floor-penetration", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.219 | Figure 10 1 Pipe Sleeve Floor Penetration",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-pipe-sleeve-floor-penetration.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 219,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 10-1 Pipe-Sleeve Floor Penetration", "Figure 10 1 Pipe Sleeve Floor Penetration"],
            "pick": "lowest",
            "margins": {"left": 46, "right": 42, "top": 214, "bottom": 32},
        },
    },
    {
        "id": "visual__fundamentals-acoustical-treatment",
        "topic": "Sanitation, Plumbing Design and Installation",
        "subtopic": "Acoustics in Plumbing Systems",
        "prompt": "Name the acoustical treatment detail shown in the illustration.",
        "answer": "Acoustical Treatment for Pipe-Sleeve Penetration at Spaces with Inner Wall on Neoprene Isolators",
        "accepted_answers": [
            "acoustical treatment for pipe-sleeve penetration at spaces with inner wall on neoprene isolators",
            "acoustical treatment for pipe sleeve penetration at spaces with inner wall on neoprene isolators",
            "pipe-sleeve penetration with inner wall on neoprene isolators",
        ],
        "caption": "Figure 10-2 Acoustical Treatment for Pipe-Sleeve Penetration at Spaces with Inner Wall on Neoprene Isolators",
        "image_alt": "Acoustical treatment detail for pipe-sleeve penetration at an inner wall with neoprene isolators.",
        "difficulty": 3,
        "explanation_short": "This is the acoustical treatment detail for pipe-sleeve penetration with inner wall neoprene isolators.",
        "explanation_long": "The figure is recognized by the inner wall on neoprene isolators, sleeve packing, and resilient sway braces used to reduce transmission.",
        "tags": ["visual-review", "acoustics", "figure-10-2-acoustical-treatment", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.219 | Figure 10 2 Acoustical Treatment for Pipe-Sleeve Penetration at Spaces with Inner Wall on Neoprene Isolators",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-acoustical-treatment.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 219,
        "crop": {
            "kind": "caption_search",
            "terms": [
                "Figure 10-2 Acoustical Treatment for Pipe-Sleeve Penetration at Spaces with Inner Wall on Neoprene Isolators",
                "Figure 10 2 Acoustical Treatment for Pipe-Sleeve Penetration at Spaces with Inner Wall on Neoprene Isolators",
            ],
            "pick": "lowest",
            "margins": {"left": 44, "right": 44, "top": 198, "bottom": 44},
        },
    },
    {
        "id": "visual__fundamentals-acoustical-seals",
        "topic": "Sanitation, Plumbing Design and Installation",
        "subtopic": "Acoustics in Plumbing Systems",
        "prompt": "Identify the acoustical penetration-seal detail.",
        "answer": "Acoustical Pipe-Penetration Seals",
        "accepted_answers": ["acoustical pipe-penetration seals", "acoustical pipe penetration seals"],
        "caption": "Figure 10-3 Acoustical Pipe-Penetration Seals",
        "image_alt": "Plumbing detail showing acoustical pipe-penetration seals around a pipe.",
        "difficulty": 2,
        "explanation_short": "The illustration is the acoustical pipe-penetration seals detail.",
        "explanation_long": "This figure shows the sealed pipe-penetration arrangement used to reduce sound transfer through wall or floor penetrations.",
        "tags": ["visual-review", "acoustics", "figure-10-3-acoustical-pipe-penetration-seals", "fundamentals"],
        "source_ref": "8. Fundamentals of Plumbing Engineering by ASPE.pdf | p.219 | Figure 10 3 Acoustical Pipe Penetration Seals",
        "quality_flag": "curated_visual",
        "asset_name": "fundamentals-acoustical-seals.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        "page": 219,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 10-3 Acoustical Pipe-Penetration Seals", "Figure 10 3 Acoustical Pipe Penetration Seals"],
            "pick": "lowest",
            "margins": {"left": 46, "right": 46, "top": 118, "bottom": 26},
        },
    },
    {
        "id": "visual__design-lavatory-installation",
        "topic": "Sanitation, Plumbing Design and Installation",
        "subtopic": "Plumbing Fixtures",
        "prompt": "Study the fixture illustration, then identify the figure.",
        "answer": "Recommended Installation Dimensions for a Lavatory",
        "accepted_answers": [
            "recommended installation dimensions for a lavatory",
            "lavatory installation dimensions",
            "recommended lavatory installation dimensions",
        ],
        "caption": "Figure 1-11 Recommended Installation Dimensions for a Lavatory",
        "image_alt": "Lavatory installation dimension drawing with hot water, cold water, and drain references.",
        "difficulty": 2,
        "explanation_short": "This figure shows recommended installation dimensions for a lavatory.",
        "explanation_long": "The cue is the lavatory elevation with drain, hot-water, and cold-water references and installation heights.",
        "tags": ["visual-review", "fixtures", "figure-1-11-recommended-installation", "engineering-design"],
        "source_ref": "9. Plumbing Engineering Design by ASPE.pdf | p.35 | Figure 1 11 Recommended Installation Dimensions for a Lavatory",
        "quality_flag": "curated_visual",
        "asset_name": "design-lavatory-installation.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/9. Plumbing Engineering Design by ASPE.pdf",
        "page": 35,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 1-11", "Figure 1 11"],
            "pick": "lowest",
            "margins": {"left": 54, "right": 176, "top": 236, "bottom": 28},
        },
    },
    {
        "id": "visual__design-copper-pipe-mechanical-t-joint",
        "topic": "Sanitation, Plumbing Design and Installation",
        "subtopic": "Piping Systems",
        "prompt": "Identify the piping-system image before revealing the answer.",
        "answer": "Copper Pipe Mechanical T-Joint",
        "accepted_answers": ["copper pipe mechanical t-joint", "copper pipe mechanical t joint"],
        "caption": "Figure 2-15 Copper Pipe Mechanical T-joint",
        "image_alt": "Photo of a copper pipe mechanical T-joint connection.",
        "difficulty": 2,
        "explanation_short": "The photo shows a copper pipe mechanical T-joint.",
        "explanation_long": "This visual helps with quick recognition of the mechanically formed copper tee fitting used in the piping systems chapter.",
        "tags": ["visual-review", "piping", "figure-2-15-copper-pipe-mechanical-t-joint", "engineering-design"],
        "source_ref": "9. Plumbing Engineering Design by ASPE.pdf | p.85 | Figure 2 15 Copper Pipe Mechanical T-joint",
        "quality_flag": "curated_visual",
        "asset_name": "design-copper-pipe-mechanical-t-joint.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/9. Plumbing Engineering Design by ASPE.pdf",
        "page": 85,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 2-15", "Figure 2 15"],
            "pick": "lowest",
            "margins": {"left": 34, "right": 142, "top": 188, "bottom": 24},
        },
    },
    {
        "id": "visual__design-typical-steel-spring-mounting",
        "topic": "Sanitation, Plumbing Design and Installation",
        "subtopic": "Acoustics and Vibration Control",
        "prompt": "Study the illustration and identify the vibration-control figure.",
        "answer": "Typical Steel Spring Mounting",
        "accepted_answers": ["typical steel spring mounting", "steel spring mounting"],
        "caption": "Figure 7-5 Typical Steel Spring Mounting",
        "image_alt": "Illustration of a typical steel spring mounting assembly.",
        "difficulty": 2,
        "explanation_short": "The figure shows a typical steel spring mounting assembly.",
        "explanation_long": "The large spring-isolator illustration is used to explain vibration control and resilient equipment support in plumbing engineering design.",
        "tags": ["visual-review", "acoustics", "figure-7-5-typical-steel-spring-mounting", "engineering-design"],
        "source_ref": "9. Plumbing Engineering Design by ASPE.pdf | p.174 | Figure 7 5 Typical Steel Spring Mounting",
        "quality_flag": "curated_visual",
        "asset_name": "design-typical-steel-spring-mounting.png",
        "source_pdf": "REFERENCE BOOKS-20260126T193100Z-3-001/9. Plumbing Engineering Design by ASPE.pdf",
        "page": 174,
        "crop": {
            "kind": "caption_search",
            "terms": ["Figure 7-5", "Figure 7 5"],
            "pick": "lowest",
            "margins": {"left": 124, "right": 118, "top": 338, "bottom": 24},
        },
    },
]


def _resolve_pdf_path(relative_path: str) -> Path:
    return MATERIALS_ROOT / relative_path


def _pick_rect(rects: list[fitz.Rect], strategy: str) -> fitz.Rect:
    if strategy == "lowest":
        return max(rects, key=lambda rect: rect.y0)
    return rects[0]


def _build_clip_rect(page: fitz.Page, crop: dict[str, Any]) -> fitz.Rect:
    if crop["kind"] != "caption_search":
        return page.rect

    rects: list[fitz.Rect] = []
    for term in crop.get("terms", []):
        rects = page.search_for(term)
        if rects:
            break

    if not rects:
        return page.rect

    target = _pick_rect(rects, crop.get("pick", "first"))
    margins = crop.get("margins", {})
    return fitz.Rect(
        max(0, target.x0 - margins.get("left", 0)),
        max(0, target.y0 - margins.get("top", 0)),
        min(page.rect.width, target.x1 + margins.get("right", 0)),
        min(page.rect.height, target.y1 + margins.get("bottom", 0)),
    )


def _render_asset(entry: dict[str, Any]) -> str:
    pdf_path = _resolve_pdf_path(entry["source_pdf"])
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    OUTPUT_ASSET_DIR.mkdir(parents=True, exist_ok=True)
    asset_path = OUTPUT_ASSET_DIR / entry["asset_name"]

    document = fitz.open(pdf_path)
    try:
        page = document.load_page(entry["page"] - 1)
        clip = _build_clip_rect(page, entry["crop"])
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2.1, 2.1), clip=clip, alpha=False)
        pixmap.save(asset_path)
    finally:
        document.close()

    return f"/visual-review/{entry['asset_name']}"


def build_visual_review_items() -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for entry in VISUAL_MANIFEST:
        image_path = _render_asset(entry)
        items.append(
            {
                "id": entry["id"],
                "topic": entry["topic"],
                "subtopic": entry["subtopic"],
                "prompt": entry["prompt"],
                "answer": entry["answer"],
                "accepted_answers": entry["accepted_answers"],
                "caption": entry["caption"],
                "image_path": image_path,
                "explanation_short": entry["explanation_short"],
                "explanation_long": entry["explanation_long"],
                "tags": entry["tags"],
                "difficulty": entry["difficulty"],
                "source_ref": entry["source_ref"],
                "quality_flag": entry["quality_flag"],
            }
        )
    return items


def main() -> None:
    items = build_visual_review_items()
    OUTPUT_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_DATA_PATH.write_text(
        json.dumps({"visual_review": items}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(items)} visual review items -> {OUTPUT_DATA_PATH}")


if __name__ == "__main__":
    main()
