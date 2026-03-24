from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

import fitz


REPO_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = REPO_ROOT.parent
MATERIALS_DIR = WORKSPACE_ROOT / "materials"
OUTPUT_JSON_PATH = REPO_ROOT / "backend" / "data" / "published" / "visual_review_curated.json"
OUTPUT_ASSET_DIR = REPO_ROOT / "frontend" / "public" / "visual-review"


@dataclass(frozen=True, slots=True)
class VisualSpec:
    id: str
    topic: str
    subtopic: str
    prompt: str
    answer: str
    explanation_short: str
    explanation_long: str
    source_file: str
    page_number: int
    caption: str
    tags: tuple[str, ...]
    difficulty: int = 2
    quality_flag: str = "curated_visual"
    crop_width_ratio: float = 0.42
    crop_height_ratio: float = 0.28
    search_text: str | None = None
    crop_box: tuple[float, float, float, float] | None = None


VISUAL_SPECS: tuple[VisualSpec, ...] = (
    VisualSpec(
        id="visual-fundamentals-square",
        topic="Plumbing Arithmetic",
        subtopic="Geometry Figures",
        prompt="Identify the illustrated plane figure and recall the area expression tied to it.",
        answer="Square. Use A = b x h for the area shown in the reviewer figure.",
        explanation_short="Square figure used to anchor the basic area formula.",
        explanation_long="This visual card reinforces square area geometry, which feeds directly into arithmetic and practical problem solving in plumbing computations.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=21,
        caption="Figure 1-1 Square",
        tags=("visual-review", "geometry", "figure-1-1-square", "fundamentals-of-plumbing-engineering"),
        difficulty=1,
        crop_width_ratio=0.3,
        crop_height_ratio=0.24,
    ),
    VisualSpec(
        id="visual-fundamentals-rhombus",
        topic="Plumbing Arithmetic",
        subtopic="Geometry Figures",
        prompt="Identify the illustrated figure and connect it to the geometry formula being reviewed.",
        answer="Rhombus. The card anchors the rhombus area relationship used in reviewer drills.",
        explanation_short="Rhombus figure for geometry recall.",
        explanation_long="Master Plumber review items often rely on fast recognition of common figures before solving dimensions and area problems.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=22,
        caption="Figure 1-3 Rhombus",
        tags=("visual-review", "geometry", "figure-1-3-rhombus", "fundamentals-of-plumbing-engineering"),
        difficulty=1,
        crop_width_ratio=0.3,
        crop_height_ratio=0.24,
    ),
    VisualSpec(
        id="visual-fundamentals-right-angle-triangle",
        topic="Plumbing Arithmetic",
        subtopic="Geometry Figures",
        prompt="Name the triangle shown and recall the area relationship attached to it.",
        answer="Right-angle triangle. Review the half-base-times-height area pattern tied to this figure.",
        explanation_short="Right-angle triangle figure for area recall.",
        explanation_long="Triangle-based geometry appears repeatedly in plumbing arithmetic and practical layout problems, so this card targets fast figure recognition.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=22,
        caption="Figure 1-7 Right Angle Triangle",
        tags=("visual-review", "geometry", "figure-1-7-right-angle-triangle", "fundamentals-of-plumbing-engineering"),
        difficulty=1,
        crop_width_ratio=0.32,
        crop_height_ratio=0.24,
    ),
    VisualSpec(
        id="visual-fundamentals-cylinder",
        topic="Plumbing Arithmetic",
        subtopic="Solid Figures",
        prompt="Identify the solid figure and link it to the volume problems commonly used in plumbing arithmetic.",
        answer="Cylinder. This figure supports pipe, tank, and volume computations.",
        explanation_short="Cylinder figure for volume and capacity recall.",
        explanation_long="Cylinder geometry is a recurring base skill for pipe and vessel calculations, so the visual is kept as a quick recognition card.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=22,
        caption="Figure 1-10 Cylinder",
        tags=("visual-review", "solid-geometry", "figure-1-10-cylinder", "fundamentals-of-plumbing-engineering"),
        difficulty=1,
        crop_width_ratio=0.34,
        crop_height_ratio=0.25,
    ),
    VisualSpec(
        id="visual-fundamentals-cone",
        topic="Plumbing Arithmetic",
        subtopic="Solid Figures",
        prompt="Identify the solid figure shown in the illustration.",
        answer="Cone. Use this figure for solid-geometry recognition during reviewer drills.",
        explanation_short="Cone figure for solid-geometry recognition.",
        explanation_long="Fast recognition of solid figures reduces friction when solving applied arithmetic and practical problem items under time pressure.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=22,
        caption="Figure 1-13 Cone",
        tags=("visual-review", "solid-geometry", "figure-1-13-cone", "fundamentals-of-plumbing-engineering"),
        difficulty=1,
        crop_width_ratio=0.32,
        crop_height_ratio=0.25,
    ),
    VisualSpec(
        id="visual-fundamentals-forward-reach-limit",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Accessibility",
        prompt="What accessibility diagram is shown, and what design concept does it enforce?",
        answer="Unobstructed Forward Reach Limit. It defines the reachable vertical and horizontal envelope for accessible fixture use.",
        explanation_short="Accessibility reach envelope diagram.",
        explanation_long="This figure supports accessibility-related fixture planning and helps connect dimensional rules to a memorable design envelope.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=129,
        caption="Figure 6-5 Unobstructed Forward Reach Limit",
        tags=("visual-review", "accessibility", "figure-6-5-unobstructed-forward-reach-limit", "fundamentals-of-plumbing-engineering"),
        difficulty=2,
        crop_width_ratio=0.48,
        crop_height_ratio=0.3,
    ),
    VisualSpec(
        id="visual-fundamentals-leg-clearances",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Accessibility",
        prompt="Identify the accessibility detail shown in the figure.",
        answer="Leg Clearances. The figure shows the under-fixture clearance envelope needed for accessible use.",
        explanation_short="Accessible leg-clearance diagram.",
        explanation_long="Accessibility questions often become easier when the candidate can visualize the required knee and leg clearance zone rather than memorize numbers alone.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=131,
        caption="Figure 6-11 Leg Clearances",
        tags=("visual-review", "accessibility", "figure-6-11-leg-clearances", "fundamentals-of-plumbing-engineering"),
        difficulty=2,
        crop_width_ratio=0.44,
        crop_height_ratio=0.3,
    ),
    VisualSpec(
        id="visual-fundamentals-pipe-sleeve-floor-penetration",
        topic="Practical Problems and Experiences",
        subtopic="Acoustics in Plumbing Systems",
        prompt="Identify the detail shown in the plumbing acoustics figure.",
        answer="Pipe-Sleeve Floor Penetration. The detail shows a pipe penetration treated to manage sound transmission through the floor assembly.",
        explanation_short="Pipe-sleeve floor penetration detail.",
        explanation_long="This card targets illustrated practical details, not just memorized text, because many practical-experience questions are easier when the detail is visually familiar.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=219,
        caption="Figure 10-1 Pipe-Sleeve Floor Penetration",
        tags=("visual-review", "acoustics", "figure-10-1-pipe-sleeve-floor-penetration", "fundamentals-of-plumbing-engineering"),
        difficulty=3,
        crop_width_ratio=0.38,
        crop_height_ratio=0.27,
    ),
    VisualSpec(
        id="visual-fundamentals-pipe-penetration-seals",
        topic="Practical Problems and Experiences",
        subtopic="Acoustics in Plumbing Systems",
        prompt="What piping-acoustics detail is illustrated here?",
        answer="Acoustical Pipe-Penetration Seals. The figure shows sealing methods used to reduce sound transfer at penetrations.",
        explanation_short="Acoustical pipe-penetration seal detail.",
        explanation_long="Recognition of acoustical details helps convert dense reference-book material into practical exam recall.",
        source_file="8. Fundamentals of Plumbing Engineering by ASPE.pdf",
        page_number=219,
        caption="Figure 10-3 Acoustical Pipe-Penetration Seals",
        tags=("visual-review", "acoustics", "figure-10-3-acoustical-pipe-penetration-seals", "fundamentals-of-plumbing-engineering"),
        difficulty=3,
        crop_width_ratio=0.38,
        crop_height_ratio=0.25,
    ),
    VisualSpec(
        id="visual-design-vacuum-breaker",
        topic="Plumbing Code",
        subtopic="Cross-Connection Control",
        prompt="Identify the backflow-prevention device shown in the figure.",
        answer="Hose Connection Vacuum Breaker. This device protects against backsiphonage at hose connections.",
        explanation_short="Hose connection vacuum breaker diagram.",
        explanation_long="Visual recognition of cross-connection control devices is valuable because exam items may refer to them by function, figure, or installation context.",
        source_file="9. Plumbing Engineering Design by ASPE.pdf",
        page_number=199,
        caption="Figure 9-11 Hose Connection Vacuum Breaker",
        tags=("visual-review", "plumbing-code", "backflow", "figure-9-11-hose-connection-vacuum-breaker", "plumbing-engineering-design"),
        difficulty=2,
        crop_width_ratio=0.36,
        crop_height_ratio=0.28,
        search_text="Figure 9-11 Hose Connection Vacuum Breaker",
        crop_box=(0.52, 0.16, 0.96, 0.67),
    ),
    VisualSpec(
        id="visual-design-gravity-sand-filter",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Water Treatment",
        prompt="Name the illustrated treatment component shown in the reviewer figure.",
        answer="Gravity Sand Filter. The figure represents a filtration stage used in water treatment layouts.",
        explanation_short="Gravity sand filter illustration.",
        explanation_long="Water treatment components are easier to separate during review when the learner ties the term to a clear visual configuration.",
        source_file="9. Plumbing Engineering Design by ASPE.pdf",
        page_number=226,
        caption="Figure 10-8 Gravity Sand Filter",
        tags=("visual-review", "water-treatment", "figure-10-8-gravity-sand-filter", "plumbing-engineering-design"),
        difficulty=2,
        crop_width_ratio=0.45,
        crop_height_ratio=0.3,
        search_text="Figure 10-8 Gravity Sand Filter",
        crop_box=(0.50, 0.02, 0.98, 0.40),
    ),
    VisualSpec(
        id="visual-design-dual-height-fountain",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Accessibility",
        prompt="Identify the accessibility fixture layout shown in the figure.",
        answer="Dual Height Design. The figure shows an accessible drinking-fountain arrangement serving users at different heights.",
        explanation_short="Dual-height drinking-fountain layout.",
        explanation_long="This card reinforces accessibility planning through recognition of the fixture arrangement, not just its dimensions.",
        source_file="9. Plumbing Engineering Design by ASPE.pdf",
        page_number=263,
        caption="Figure 12-6 Dual Height Design",
        tags=("visual-review", "accessibility", "figure-12-6-dual-height-design", "plumbing-engineering-design"),
        difficulty=2,
        crop_width_ratio=0.44,
        crop_height_ratio=0.3,
        search_text="Figure 12-6 Dual-height Design",
        crop_box=(0.03, 0.42, 0.52, 0.88),
    ),
    VisualSpec(
        id="visual-code-air-gap",
        topic="Plumbing Code",
        subtopic="Cross-Connection Control",
        prompt="Identify the backflow-prevention method shown in the plumbing-code figure.",
        answer="Air Gap. The figure shows a physical unobstructed separation above the flood-level rim.",
        explanation_short="Air-gap backflow-prevention figure from the illustrated plumbing code.",
        explanation_long="This is the simplest backflow-protection figure in the code set and a core visual distinction from vacuum breakers and valve assemblies.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=57,
        caption="Air Gap",
        tags=("visual-review", "plumbing-code", "backflow", "air-gap", "illustrated-code"),
        difficulty=1,
        crop_box=(0.20, 0.05, 0.80, 0.34),
    ),
    VisualSpec(
        id="visual-code-atmospheric-vacuum-breaker",
        topic="Plumbing Code",
        subtopic="Cross-Connection Control",
        prompt="What backflow-prevention device is illustrated in the flow and non-flow condition figure?",
        answer="Atmospheric Vacuum Breaker. The figure shows the body, checking member, and atmospheric opening.",
        explanation_short="Atmospheric vacuum breaker figure from the illustrated code.",
        explanation_long="This card helps distinguish the atmospheric vacuum breaker from the pressure vacuum breaker and reduced-pressure assembly used elsewhere in the code.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=57,
        caption="Atmospheric Vacuum Breaker",
        tags=("visual-review", "plumbing-code", "backflow", "atmospheric-vacuum-breaker", "illustrated-code"),
        difficulty=2,
        crop_box=(0.10, 0.28, 0.94, 0.62),
    ),
    VisualSpec(
        id="visual-code-double-check-valve-assembly",
        topic="Plumbing Code",
        subtopic="Cross-Connection Control",
        prompt="Identify the backflow-prevention assembly with two check valves and test cocks.",
        answer="Double Check Valve Backflow Prevention Assembly. The figure shows the paired check valves with test cocks and isolation valves.",
        explanation_short="Double-check-valve assembly figure from the illustrated code.",
        explanation_long="This diagram is useful because exam items often name the valves and test cocks rather than showing the device with a direct label.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=57,
        caption="Double Check Valve Backflow Prevention Assembly",
        tags=("visual-review", "plumbing-code", "backflow", "double-check-valve", "illustrated-code"),
        difficulty=2,
        crop_box=(0.08, 0.60, 0.94, 0.98),
    ),
    VisualSpec(
        id="visual-code-pressure-vacuum-breaker",
        topic="Plumbing Code",
        subtopic="Cross-Connection Control",
        prompt="What backflow-prevention assembly is shown in the upper figure?",
        answer="Pressure Vacuum Breaker Backflow Prevention Assembly. The figure shows the loaded air inlet valve, check valve, test cocks, and isolation valves.",
        explanation_short="Pressure vacuum breaker assembly figure from the illustrated code.",
        explanation_long="This visual separates the pressure vacuum breaker from the simpler atmospheric vacuum breaker and from the more complex reduced-pressure assembly.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=58,
        caption="Pressure Vacuum Breaker Backflow Prevention Assembly",
        tags=("visual-review", "plumbing-code", "backflow", "pressure-vacuum-breaker", "illustrated-code"),
        difficulty=2,
        crop_box=(0.22, 0.03, 0.78, 0.40),
    ),
    VisualSpec(
        id="visual-code-reduced-pressure-principle-assembly",
        topic="Plumbing Code",
        subtopic="Cross-Connection Control",
        prompt="Identify the backflow-prevention assembly with the differential pressure relief valve.",
        answer="Reduced Pressure Principle Backflow Prevention Assembly. The figure shows two check valves, test cocks, and the intermediate pressure relief valve.",
        explanation_short="Reduced-pressure-principle assembly figure from the illustrated code.",
        explanation_long="This is a high-value code visual because the reduced-pressure assembly is one of the most important backflow-prevention devices to recognize by parts and profile.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=58,
        caption="Reduced Pressure Principle Backflow Prevention Assembly",
        tags=("visual-review", "plumbing-code", "backflow", "reduced-pressure-principle", "illustrated-code"),
        difficulty=3,
        crop_box=(0.08, 0.36, 0.95, 0.96),
    ),
    VisualSpec(
        id="visual-code-roof-drain-dome-strainer",
        topic="Plumbing Code",
        subtopic="Storm Drainage",
        prompt="Identify the storm-drainage detail shown in the illustrated code figure.",
        answer="Roof Drain with Dome-Type Strainer. The figure shows the roof-drain body, flashing, and protective strainer detail.",
        explanation_short="Roof-drain and dome-type-strainer figure from the illustrated code.",
        explanation_long="This card translates the code text on roof drains into a visual reference that is easier to retain during storm-drainage review.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=123,
        caption="Roof Drain and Dome-Type Strainer",
        tags=("visual-review", "plumbing-code", "storm-drainage", "roof-drain", "illustrated-code"),
        difficulty=2,
        crop_box=(0.28, 0.38, 0.96, 0.90),
    ),
    VisualSpec(
        id="visual-code-building-sewer-cleanout",
        topic="Plumbing Code",
        subtopic="House Drains and House Sewers",
        prompt="What plumbing-code access detail is shown in the cleanout figure?",
        answer="Building Sewer Cleanout to Finished Grade. The figure shows the cleanout extended for grade-level access.",
        explanation_short="Building-sewer cleanout detail from the illustrated code.",
        explanation_long="This figure helps anchor the cleanout-access rule by showing how the fitting is brought up to grade rather than leaving it as a text-only requirement.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=140,
        caption="Building Sewer Cleanout to Finished Grade",
        tags=("visual-review", "plumbing-code", "cleanout", "building-sewer", "illustrated-code"),
        difficulty=2,
        crop_box=(0.18, 0.00, 0.76, 0.35),
    ),
    VisualSpec(
        id="visual-code-sewer-water-pipe-separation",
        topic="Plumbing Code",
        subtopic="House Drains and House Sewers",
        prompt="Identify the code figure that shows the trench relationship between the sewer line and the water pipe.",
        answer="Sewer and Water Pipe Separation. The figure shows the required vertical and horizontal separation in a common trench.",
        explanation_short="Sewer-and-water-pipe separation figure from the illustrated code.",
        explanation_long="This is a practical code visual because it turns spacing rules into a trench drawing that is easier to recall under exam pressure.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=141,
        caption="Sewer and Water Pipe Separation",
        tags=("visual-review", "plumbing-code", "water-supply", "house-sewer", "illustrated-code"),
        difficulty=2,
        crop_box=(0.30, 0.18, 0.86, 0.88),
    ),
    VisualSpec(
        id="visual-code-abandoned-septic-tank-fill",
        topic="Plumbing Code",
        subtopic="Private Sewage Disposal",
        prompt="Identify the private-sewage figure that shows what happens to a septic tank after abandonment.",
        answer="Abandoned Septic Tank Fill Detail. The figure shows the abandoned septic tank being filled after removal from service.",
        explanation_short="Abandoned septic-tank fill figure from the illustrated code.",
        explanation_long="This card gives the abandonment rule a strong visual anchor and keeps private-sewage requirements from remaining purely text memory.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=143,
        caption="Abandoned Septic Tank Fill Detail",
        tags=("visual-review", "plumbing-code", "septic-tank", "private-sewage", "illustrated-code"),
        difficulty=2,
        crop_box=(0.56, 0.10, 0.96, 0.68),
    ),
    VisualSpec(
        id="visual-code-vent-stack-diagram",
        topic="Plumbing Code",
        subtopic="Vents and Venting",
        prompt="Identify the venting arrangement shown in the illustrated-code figure.",
        answer="Vent Stack Diagram. The figure shows the branch vent, vent stack, stack vent, and relief vent relationship in a drainage stack.",
        explanation_short="Vent-stack arrangement from the illustrated plumbing code.",
        explanation_long="This is a strong code visual because it turns a venting paragraph into a stack layout that is easier to recall under exam pressure.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=103,
        caption="Section 901 Vents Required Vent Stack Diagram",
        tags=("visual-review", "plumbing-code", "venting", "vent-stack", "illustrated-code"),
        difficulty=2,
        crop_box=(0.18, 0.18, 0.70, 0.70),
    ),
    VisualSpec(
        id="visual-code-vent-termination-clearance",
        topic="Plumbing Code",
        subtopic="Vents and Venting",
        prompt="What code detail is shown by the roof and outdoor vent-termination sketches?",
        answer="Vent Termination Clearance. The figure shows roof-clearance and outdoor-location requirements for vent terminals.",
        explanation_short="Vent-termination clearance figures from the illustrated plumbing code.",
        explanation_long="This card helps fix the code clearances to a roof profile and an outdoor-installation profile instead of leaving them as isolated numbers.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=107,
        caption="Section 906 Vent Termination Clearance",
        tags=("visual-review", "plumbing-code", "venting", "vent-termination", "illustrated-code"),
        difficulty=2,
        crop_box=(0.18, 0.18, 0.80, 0.80),
    ),
    VisualSpec(
        id="visual-code-prohibited-traps",
        topic="Plumbing Code",
        subtopic="Traps and Interceptors",
        prompt="Identify the trap-reference figure showing prohibited trap configurations.",
        answer="Prohibited Traps. The lower strip shows forms such as S-traps, 3/4 S-traps, bell traps, and crown-vented traps.",
        explanation_short="Prohibited-traps strip from the illustrated plumbing code.",
        explanation_long="Trap questions are easier when the candidate can recognize the prohibited shapes instead of relying on text-only memorization.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=114,
        caption="Section 1004 Traps Prohibited",
        tags=("visual-review", "plumbing-code", "traps", "prohibited-traps", "illustrated-code"),
        difficulty=2,
        crop_box=(0.05, 0.72, 0.96, 0.97),
    ),
    VisualSpec(
        id="visual-code-grease-trap",
        topic="Plumbing Code",
        subtopic="Traps and Interceptors",
        prompt="Identify the interceptor device shown in the illustrated plumbing-code figures.",
        answer="Grease Trap. The figures show the grease-trap unit and the sectional flow-path detail.",
        explanation_short="Grease-trap figures from the illustrated plumbing code.",
        explanation_long="This card reinforces the common grease-trap visual profile, which is more durable in recall than reading the code description alone.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=118,
        caption="Section 1015 Grease Trap",
        tags=("visual-review", "plumbing-code", "grease-trap", "interceptors", "illustrated-code"),
        difficulty=2,
        crop_box=(0.50, 0.22, 0.98, 0.80),
    ),
    VisualSpec(
        id="visual-code-sand-interceptor",
        topic="Plumbing Code",
        subtopic="Traps and Interceptors",
        prompt="What interceptor detail is shown by the paired code figures?",
        answer="Sand Interceptor. The figures show the interceptor chamber and the box-type exterior form.",
        explanation_short="Sand-interceptor figures from the illustrated plumbing code.",
        explanation_long="This card turns a dense section on interceptors into a simple visual recognition cue that is easier to retrieve in exams.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=121,
        caption="Section 1016 Sand Interceptors",
        tags=("visual-review", "plumbing-code", "sand-interceptor", "interceptors", "illustrated-code"),
        difficulty=2,
        crop_box=(0.18, 0.25, 0.90, 0.58),
    ),
    VisualSpec(
        id="visual-code-roof-drain-interior-detail",
        topic="Plumbing Code",
        subtopic="Storm Drainage",
        prompt="Identify the roof-drain construction detail shown in the top figures.",
        answer="Roof Drain Passing Through the Roof Into the Interior of a Building. The figures show the grate, flashing, flange, and body arrangement.",
        explanation_short="Interior roof-drain detail from the illustrated plumbing code.",
        explanation_long="This visual anchors a storm-drainage construction detail that often gets lost when learners only read the prose requirement.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=124,
        caption="Roof Drains Passing Through the Roof Into the Interior of a Building",
        tags=("visual-review", "plumbing-code", "storm-drainage", "roof-drain", "illustrated-code"),
        difficulty=2,
        crop_box=(0.10, 0.00, 0.96, 0.26),
    ),
    VisualSpec(
        id="visual-code-public-sewer-layout",
        topic="Plumbing Code",
        subtopic="House Drains and House Sewers",
        prompt="Identify the site-layout figure that shows connection to the public sewer.",
        answer="Public Sewer System Layout. The figure shows the building drain, cleanout, manhole, and public sewer connection.",
        explanation_short="Public-sewer connection layout from the illustrated plumbing code.",
        explanation_long="This card translates the sewer-required rule into a memorable site layout instead of leaving it as text on connections and exceptions.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=134,
        caption="Section 1201 Sewer Required Public Sewer Layout",
        tags=("visual-review", "plumbing-code", "house-sewer", "public-sewer", "illustrated-code"),
        difficulty=2,
        crop_box=(0.15, 0.20, 0.88, 0.50),
    ),
    VisualSpec(
        id="visual-code-private-sewage-layout",
        topic="Plumbing Code",
        subtopic="Private Sewage Disposal",
        prompt="Identify the site-layout figure that shows the private sewage disposal system.",
        answer="Private Sewage Disposal System Layout. The figure shows the building drain, septic tank, distribution box, and drain field arrangement.",
        explanation_short="Private-sewage-disposal layout from the illustrated plumbing code.",
        explanation_long="This is a high-value private-sewage visual because it maps the system parts into one site layout instead of forcing piece-by-piece memorization.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=134,
        caption="Private Sewage Disposal System",
        tags=("visual-review", "plumbing-code", "private-sewage", "septic-tank", "illustrated-code"),
        difficulty=2,
        crop_box=(0.12, 0.55, 0.90, 0.94),
    ),
    VisualSpec(
        id="visual-code-cleanout-reference",
        topic="Plumbing Code",
        subtopic="House Drains and House Sewers",
        prompt="What plumbing-code maintenance-access reference is shown across these cleanout sketches?",
        answer="Cleanout Reference Diagram. The figures show two-way cleanout installation, change-of-direction reference, and maximum distance between cleanouts.",
        explanation_short="Cleanout-reference page from the illustrated plumbing code.",
        explanation_long="This card gives the learner one visual anchor for several cleanout rules that are often tested separately but learned together.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=139,
        caption="Cleanout Reference Diagrams",
        tags=("visual-review", "plumbing-code", "cleanout", "house-sewer", "illustrated-code"),
        difficulty=3,
        crop_box=(0.08, 0.00, 0.92, 0.86),
    ),
    VisualSpec(
        id="visual-code-seepage-pit",
        topic="Plumbing Code",
        subtopic="Private Sewage Disposal",
        prompt="Identify the private-sewage disposal figure shown in the appendix detail.",
        answer="Seepage Pit. The figure shows the seepage pit section with sidewall depth, backfill, inlet, and gravel zones.",
        explanation_short="Seepage-pit detail from the illustrated plumbing code appendix.",
        explanation_long="The seepage-pit cross section is a strong appendix visual because it ties depth, materials, and inflow details into one figure.",
        source_file="1A. Illustrated National Plumbing Code of the Philippines.pdf",
        page_number=192,
        caption="Appendix B Seepage Pit Section",
        tags=("visual-review", "plumbing-code", "private-sewage", "seepage-pit", "illustrated-code"),
        difficulty=3,
        crop_box=(0.12, 0.12, 0.82, 0.72),
    ),
    VisualSpec(
        id="visual-week4-water-meter-details",
        topic="Plumbing Code",
        subtopic="Water Service",
        prompt="Identify the service-assembly diagram shown in this reviewer slide.",
        answer="Water Meter Details. The figure shows the service-line arrangement with gate valve, water meter, check valve, and unions.",
        explanation_short="Water meter assembly diagram from the review material.",
        explanation_long="This card turns a common plumbing-code/service-line figure into a fast visual recall item instead of leaving it buried inside a slide deck.",
        source_file="WEEK 4.pdf",
        page_number=85,
        caption="Water Meter Details",
        tags=("visual-review", "plumbing-code", "water-service", "week-4", "water-meter-details"),
        difficulty=2,
        crop_box=(0.10, 0.18, 0.88, 0.92),
    ),
    VisualSpec(
        id="visual-week7-face-to-face-distance",
        topic="Practical Problems and Experiences",
        subtopic="Measuring, Cutting and Joining Pipes",
        prompt="Study the pipe-measurement figure and identify the labeled dimension being asked in the slide.",
        answer="Face to Face Distance. The figure highlights the fitting-to-fitting measurement used in pipe layout work.",
        explanation_short="Pipe-measurement diagram for face-to-face distance.",
        explanation_long="This is a good practical visual because the exam can point to a layout figure and ask for the specific measurement term rather than a pure text definition.",
        source_file="WEEK 7.pdf",
        page_number=5,
        caption="Tube/Pipe Measurement Diagram - Face to Face Distance",
        tags=("visual-review", "practical", "pipe-measurement", "week-7", "face-to-face-distance"),
        difficulty=2,
        crop_box=(0.04, 0.20, 0.66, 0.76),
    ),
    VisualSpec(
        id="visual-week7-hot-water-condenser",
        topic="Practical Problems and Experiences",
        subtopic="Steam and Hot Water Drainage",
        prompt="What condenser detail is being used in this review slide, and what component purpose is highlighted?",
        answer="Hot Water Condenser. Wearing plates or baffles are installed to protect the shell.",
        explanation_short="Condenser detail with the shell-protection callout.",
        explanation_long="The visual ties the RNPCP condenser figure to the practical purpose of the wearing plates or baffles, which is the actual recall target in the slide deck.",
        source_file="WEEK 7.pdf",
        page_number=14,
        caption="Figure 810.1 Hot Water Condenser",
        tags=("visual-review", "practical", "condenser", "week-7", "hot-water-condenser"),
        difficulty=3,
        crop_box=(0.55, 0.38, 0.98, 0.88),
    ),
    VisualSpec(
        id="visual-week9-septic-tank-minimum-dimensions",
        topic="Plumbing Code",
        subtopic="Septic Tank",
        prompt="Identify the plumbing-code diagram shown in this review slide.",
        answer="Septic Tank Minimum Dimensions. The figure maps inlet, outlet, liquid depth, manholes, and required clearances.",
        explanation_short="Septic tank minimum-dimensions reference diagram.",
        explanation_long="This card turns a dense septic-tank dimension sheet into a visual anchor for Appendix B style plumbing-code questions.",
        source_file="WEEK 9.pdf",
        page_number=46,
        caption="Septic Tank Minimum Dimensions",
        tags=("visual-review", "plumbing-code", "septic-tank", "week-9", "minimum-dimensions"),
        difficulty=3,
        crop_box=(0.18, 0.16, 0.86, 0.92),
    ),
    VisualSpec(
        id="visual-bp344-handrail-detail",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Accessibility",
        prompt="Identify the accessibility figure shown at the top of the BP344 page.",
        answer="Handrail Detail for Ramps. The figure shows the minimum and suggested ramp-handrail configuration.",
        explanation_short="BP344 handrail detail for accessible ramps.",
        explanation_long="This card converts the BP344 appendix figure into a direct visual recognition item, which is more useful than memorizing text-only ramp rules.",
        source_file="12. AMENDED IRR BP344- OFFICIAL GAZETTE.pdf",
        page_number=21,
        caption="Fig. A.5.1 Handrail Detail for Ramps",
        tags=("visual-review", "accessibility", "bp344", "handrail-detail", "ramps"),
        difficulty=2,
        crop_box=(0.22, 0.02, 0.78, 0.43),
    ),
    VisualSpec(
        id="visual-bp344-accessible-ramp-cross-section",
        topic="Sanitation, Plumbing Design and Installation",
        subtopic="Accessibility",
        prompt="Identify the accessibility figure shown at the bottom of the BP344 page.",
        answer="Cross Section of Accessible Ramp. The figure reinforces handrail extension and ramp-height relationships.",
        explanation_short="BP344 cross-section of an accessible ramp.",
        explanation_long="This visual card keeps the ramp section memorable by tying the BP344 dimensions to the actual graphic instead of leaving them as isolated numbers.",
        source_file="12. AMENDED IRR BP344- OFFICIAL GAZETTE.pdf",
        page_number=21,
        caption="Fig. A.5.2 Cross Section of Accessible Ramp",
        tags=("visual-review", "accessibility", "bp344", "accessible-ramp", "cross-section"),
        difficulty=2,
        crop_box=(0.18, 0.46, 0.82, 0.98),
    ),
)


def resolve_pdf_path(source_file: str) -> Path:
    matches = list(MATERIALS_DIR.rglob(source_file))
    if not matches:
        raise FileNotFoundError(f"Could not find source PDF: {source_file}")
    return matches[0]


def _caption_variants(caption: str) -> list[str]:
    normalized = " ".join(caption.split())
    variants = {normalized}

    number_match = re.search(r"Figure\s+(\d+)[ -](\d+)", normalized, flags=re.IGNORECASE)
    if number_match:
        chapter = number_match.group(1)
        figure = number_match.group(2)
        suffix = normalized[number_match.end() :].strip()
        variants.add(f"Figure {chapter}-{figure}")
        variants.add(f"Figure {chapter} {figure}")
        if suffix:
            variants.add(f"Figure {chapter}-{figure} {suffix}")
            variants.add(f"Figure {chapter} {figure} {suffix}")
        variants.add(f"{chapter}-{figure}")

    return sorted(variants, key=len, reverse=True)


def _find_caption_rect(page: fitz.Page, caption: str) -> fitz.Rect | None:
    for term in _caption_variants(caption):
        rects = page.search_for(term)
        if rects:
            return rects[0]
    return None


def _clamp_rect(rect: fitz.Rect, bounds: fitz.Rect) -> fitz.Rect:
    return fitz.Rect(
        max(bounds.x0, rect.x0),
        max(bounds.y0, rect.y0),
        min(bounds.x1, rect.x1),
        min(bounds.y1, rect.y1),
    )


def build_crop_rect(page: fitz.Page, spec: VisualSpec) -> fitz.Rect:
    page_rect = page.rect
    if spec.crop_box is not None:
        x0, y0, x1, y1 = spec.crop_box
        return fitz.Rect(
            page_rect.x0 + page_rect.width * x0,
            page_rect.y0 + page_rect.height * y0,
            page_rect.x0 + page_rect.width * x1,
            page_rect.y0 + page_rect.height * y1,
        )

    caption_rect = _find_caption_rect(page, spec.search_text or spec.caption)
    if caption_rect is None:
        return page_rect

    target_width = max(page_rect.width * spec.crop_width_ratio, caption_rect.width * 2.0)
    target_height = max(page_rect.height * spec.crop_height_ratio, caption_rect.height * 6.0)
    center_x = caption_rect.x0 + (caption_rect.width / 2)
    y1 = min(page_rect.y1, caption_rect.y1 + page_rect.height * 0.04)
    y0 = max(page_rect.y0, y1 - target_height)
    x0 = max(page_rect.x0, center_x - (target_width / 2))
    x1 = min(page_rect.x1, center_x + (target_width / 2))

    rect = fitz.Rect(x0, y0, x1, y1)
    return _clamp_rect(rect, page_rect)


def render_visual_asset(spec: VisualSpec) -> str:
    source_path = resolve_pdf_path(spec.source_file)
    output_path = OUTPUT_ASSET_DIR / f"{spec.id}.png"
    OUTPUT_ASSET_DIR.mkdir(parents=True, exist_ok=True)

    with fitz.open(source_path) as document:
        page = document.load_page(spec.page_number - 1)
        clip = build_crop_rect(page, spec)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2.6, 2.6), clip=clip, alpha=False)
        pixmap.save(output_path)

    return f"/visual-review/{output_path.name}"


def build_payload() -> dict[str, list[dict[str, object]]]:
    items: list[dict[str, object]] = []
    for spec in VISUAL_SPECS:
        image_path = render_visual_asset(spec)
        item = {
            "id": spec.id,
            "topic": spec.topic,
            "subtopic": spec.subtopic,
            "prompt": spec.prompt,
            "answer": spec.answer,
            "accepted_answers": [spec.answer, spec.caption],
            "caption": spec.caption,
            "image_path": image_path,
            "explanation_short": spec.explanation_short,
            "explanation_long": spec.explanation_long,
            "tags": list(spec.tags),
            "difficulty": spec.difficulty,
            "source_ref": f"{spec.source_file} | p.{spec.page_number} | {spec.caption}",
            "quality_flag": spec.quality_flag,
        }
        items.append(item)
    return {"visual_review": items}


def main() -> None:
    payload = build_payload()
    OUTPUT_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "output_json": str(OUTPUT_JSON_PATH),
                "asset_dir": str(OUTPUT_ASSET_DIR),
                "visual_item_count": len(payload["visual_review"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
