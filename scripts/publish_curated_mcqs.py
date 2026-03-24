from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
STAGING_DIR = REPO_ROOT / "backend" / "data" / "staging"
PUBLISHED_DIR = REPO_ROOT / "backend" / "data" / "published"


BATCH1_ITEMS: list[dict[str, Any]] = [
    {
        "source_file": "advance-qa__week-01__mcq__candidate__v1.json",
        "id": "advance-qa__week-01-q013",
        "difficulty": "Easy",
        "prompt": "According to ASPE, which range describes very hard water?",
        "choices": [
            {"label": "A", "text": "0-75 mg/L as CaCO3"},
            {"label": "B", "text": "76-150 mg/L as CaCO3"},
            {"label": "C", "text": "151-300 mg/L as CaCO3"},
            {"label": "D", "text": "Over 300 mg/L as CaCO3"},
        ],
        "answer_key": "D",
        "explanation_short": "ASPE classifies water over 300 mg/L as CaCO3 as very hard.",
        "explanation_long": "ASPE hardness categories place very hard water above 300 mg/L as calcium carbonate (CaCO3).",
    },
    {
        "source_file": "advance-qa__week-01__mcq__candidate__v1.json",
        "id": "advance-qa__week-01-q020",
        "difficulty": "Easy",
        "prompt": "Which of the following is NOT an equivalent expression for the density of water?",
        "choices": [
            {"label": "A", "text": "1 gram/mm3"},
            {"label": "B", "text": "62.4 lb/ft3"},
            {"label": "C", "text": "1000 kg/m3"},
            {"label": "D", "text": "9.81 kN/m3"},
        ],
        "answer_key": "A",
        "explanation_short": "Water density is commonly expressed as 1 g/cm3, 1000 kg/m3, 62.4 lb/ft3, or 9.81 kN/m3.",
        "explanation_long": "The exception is 1 gram/mm3. Standard equivalents for water are 1 g/cm3, 1000 kg/m3, 62.4 lb/ft3, and 9.81 kN/m3.",
    },
    {
        "source_file": "advance-qa__week-01__mcq__candidate__v1.json",
        "id": "advance-qa__week-01-q042",
        "difficulty": "Hard",
        "prompt": "Plumbing fixtures classified as Class 3 are intended for:",
        "choices": [
            {"label": "A", "text": "Office"},
            {"label": "B", "text": "Condominium"},
            {"label": "C", "text": "Factory"},
            {"label": "D", "text": "Cinema"},
        ],
        "answer_key": "D",
        "explanation_short": "Class 3 fixtures are for public or unrestricted use.",
        "explanation_long": "The extracted classification notes that Class 3 fixtures are for public use or unrestricted use settings such as schools, terminals, comfort rooms, and similar public occupancies. A cinema fits that class.",
    },
    {
        "source_file": "advance-qa__week-02__mcq__candidate__v1.json",
        "id": "advance-qa__week-02-q006",
        "difficulty": "Hard",
        "prompt": "Discharge from a sump pump with 7 gpm of flow is equivalent to how many fixture units?",
        "choices": [
            {"label": "A", "text": "0.936 FU"},
            {"label": "B", "text": "5.5 FU"},
            {"label": "C", "text": "21 FU"},
            {"label": "D", "text": "14 FU"},
        ],
        "answer_key": "D",
        "explanation_short": "Continuous flow from a sump pump is rated at 2 fixture units per gpm.",
        "explanation_long": "RNPCP Appendix guidance treats continuous flow from sump pumps and similar devices as 2 fixture units for every 1 gpm (0.063 L/s). At 7 gpm, that equals 14 fixture units.",
    },
    {
        "source_file": "advance-qa__week-02__mcq__candidate__v1.json",
        "id": "advance-qa__week-02-q031",
        "difficulty": "Easy",
        "prompt": "A pump capable of generating 150 feet of head of gasoline would provide a pressure of about:",
        "choices": [
            {"label": "A", "text": "55.50 psig"},
            {"label": "B", "text": "45.50 psig"},
            {"label": "C", "text": "95.50 psig"},
            {"label": "D", "text": "60.50 psig"},
        ],
        "answer_key": "B",
        "explanation_short": "Use 150 ft / 2.31 ft per psi, then multiply by gasoline specific gravity 0.70.",
        "explanation_long": "Water pressure head converts at about 2.31 ft per psi. For gasoline, multiply by the specific gravity: (150 / 2.31) x 0.70 = about 45.5 psig.",
    },
    {
        "source_file": "advance-qa__week-02__mcq__candidate__v1.json",
        "id": "advance-qa__week-02-q034",
        "difficulty": "Medium",
        "prompt": "Which form of precipitation is sometimes called mist and consists of tiny liquid droplets about 0.1 mm to 0.5 mm in diameter?",
        "choices": [
            {"label": "A", "text": "Rain"},
            {"label": "B", "text": "Hail"},
            {"label": "C", "text": "Drizzle"},
            {"label": "D", "text": "Glaze"},
        ],
        "answer_key": "C",
        "explanation_short": "Drizzle is made of very small liquid droplets, often mist-like in appearance.",
        "explanation_long": "Drizzle refers to very small liquid water droplets, usually around 0.1 mm to 0.5 mm in diameter, which makes it finer than ordinary rain.",
    },
    {
        "source_file": "advance-qa__week-02__mcq__candidate__v1.json",
        "id": "advance-qa__week-02-q040",
        "difficulty": "Medium",
        "prompt": "When a gutter has a semi-circular bottom, what is the depth of the equivalent rectangular gutter area?",
        "choices": [
            {"label": "A", "text": "0.392 x diameter"},
            {"label": "B", "text": "0.8862 x diameter"},
            {"label": "C", "text": "0.7762 x diameter"},
            {"label": "D", "text": "0.492 x diameter"},
        ],
        "answer_key": "A",
        "explanation_short": "The equivalent rectangular gutter depth is 0.392 times the diameter.",
        "explanation_long": "RNPCP gutter sizing references use 0.392 x diameter as the depth of the equivalent rectangular gutter when the actual gutter bottom is semi-circular.",
    },
    {
        "source_file": "advance-qa__week-03__mcq__candidate__v1.json",
        "id": "advance-qa__week-03-q011",
        "difficulty": "Hard",
        "prompt": "If a pressure reading is 120 m of water head, what is the equivalent pressure in kPa?",
        "choices": [
            {"label": "A", "text": "1069 kPa"},
            {"label": "B", "text": "2717 kPa"},
            {"label": "C", "text": "6274 kPa"},
            {"label": "D", "text": "1177 kPa"},
        ],
        "answer_key": "D",
        "explanation_short": "Convert head using 1 m of water head = 9.81 kPa.",
        "explanation_long": "Multiply 120 m by 9.81 kPa per meter of water head. That gives 1177.2 kPa, which rounds to 1177 kPa.",
    },
    {
        "source_file": "advance-qa__week-03__mcq__candidate__v1.json",
        "id": "advance-qa__week-03-q014",
        "difficulty": "Medium",
        "prompt": "A closed cylindrical container is filled with a fluid that has a specific gravity of 1.7. What pressure does this fluid exert at a depth of 15 m?",
        "choices": [
            {"label": "A", "text": "250,155 Pa"},
            {"label": "B", "text": "209,000 Pa"},
            {"label": "C", "text": "240,000 Pa"},
            {"label": "D", "text": "203,700 Pa"},
        ],
        "answer_key": "A",
        "explanation_short": "Use P = rho x g x h with rho = 1700 kg/m3.",
        "explanation_long": "Specific gravity 1.7 means the fluid density is 1700 kg/m3. Using P = rho x g x h gives 1700 x 9.81 x 15 = 250,155 Pa.",
    },
    {
        "source_file": "advance-qa__week-03__mcq__candidate__v1.json",
        "id": "advance-qa__week-03-q015",
        "difficulty": "Hard",
        "prompt": "If flow through a 12-inch pipe is 830 gpm, what is the velocity in feet per second?",
        "choices": [
            {"label": "A", "text": "2.35 ft/s"},
            {"label": "B", "text": "2.80 ft/s"},
            {"label": "C", "text": "3.00 ft/s"},
            {"label": "D", "text": "2.00 ft/s"},
        ],
        "answer_key": "A",
        "explanation_short": "Use the volumetric flow relation Q = V x A.",
        "explanation_long": "Convert 830 gpm to cubic feet per second, compute the cross-sectional area of a 12-inch pipe, and use Q = V x A. The velocity comes out to about 2.35 ft/s.",
    },
    {
        "source_file": "advance-qa__week-03__mcq__candidate__v1.json",
        "id": "advance-qa__week-03-q023",
        "difficulty": "Medium",
        "prompt": "What type of pump uses an impeller mounted on a rotating shaft to increase water velocity?",
        "choices": [
            {"label": "A", "text": "Gear pump"},
            {"label": "B", "text": "Rotary vane pump"},
            {"label": "C", "text": "Piston pump"},
            {"label": "D", "text": "Centrifugal pump"},
        ],
        "answer_key": "D",
        "explanation_short": "A centrifugal pump raises fluid velocity by spinning an impeller.",
        "explanation_long": "Centrifugal pumps use an impeller on a rotating shaft. The impeller imparts velocity to the water, which is then converted into pressure energy.",
    },
    {
        "source_file": "advance-qa__week-05__mcq__candidate__v1.json",
        "id": "advance-qa__week-05-q031",
        "difficulty": "Easy",
        "prompt": "Which solder alloy is best for plumbing brazing or soldering joints in this reviewer set?",
        "choices": [
            {"label": "A", "text": "100% alloy"},
            {"label": "B", "text": "95% tin, 5% alloy"},
            {"label": "C", "text": "50% tin, 50% alloy"},
            {"label": "D", "text": "None of the above"},
        ],
        "answer_key": "B",
        "explanation_short": "The keyed answer in the source material is 95% tin and 5% alloy.",
        "explanation_long": "This reviewer item keys the best solder choice as 95% tin and 5% alloy, which matches the extracted explanation in the source pages.",
    },
    {
        "source_file": "advance-qa__week-05__mcq__candidate__v1.json",
        "id": "advance-qa__week-05-q047",
        "difficulty": "Hard",
        "prompt": "Gaskets must withstand pressure, temperature, and chemical attack. Gaskets normally should be as ____ as possible.",
        "choices": [
            {"label": "A", "text": "Thin"},
            {"label": "B", "text": "Thick"},
            {"label": "C", "text": "Durable"},
            {"label": "D", "text": "Small"},
        ],
        "answer_key": "A",
        "explanation_short": "Standard gaskets are thin so they can form an effective seal.",
        "explanation_long": "The extracted explanation notes that most standard gaskets are about 1/16 inch or 1/8 inch thick and should be as thin as possible while still creating an effective seal.",
    },
    {
        "source_file": "advance-qa__week-07__mcq__candidate__v1.json",
        "id": "advance-qa__week-07-q027",
        "difficulty": "Hard",
        "prompt": "What is the minimum size of the waste pipe and trap in a CW and VS relative to the required pipe size and tailpiece size?",
        "choices": [
            {"label": "A", "text": "1 pipe size larger"},
            {"label": "B", "text": "51 mm"},
            {"label": "C", "text": "2 pipe sizes larger"},
            {"label": "D", "text": "76 mm"},
        ],
        "answer_key": "C",
        "explanation_short": "The waste pipe and trap must be at least two pipe sizes larger.",
        "explanation_long": "RNPCP Chapter 8 requires each waste pipe and trap in any CW and VS to be at least two pipe sizes larger than the size required by code and at least two pipe sizes larger than any fixture tailpiece or connection.",
    },
    {
        "source_file": "advance-qa__week-07__mcq__candidate__v1.json",
        "id": "advance-qa__week-07-q035",
        "difficulty": "Hard",
        "prompt": "What is the fixture unit rating of clothes washers when installed in groups of three or more?",
        "choices": [
            {"label": "A", "text": "3 FU"},
            {"label": "B", "text": "6 FU"},
            {"label": "C", "text": "9 FU"},
            {"label": "D", "text": "10 FU"},
        ],
        "answer_key": "B",
        "explanation_short": "Clothes washers in groups of three or more are rated at 6 fixture units each.",
        "explanation_long": "The extracted RNPCP guidance states that clothes washers in groups of three or more shall be rated at six fixture units each for the common horizontal and vertical waste pipe.",
    },
    {
        "source_file": "advance-qa__week-07__mcq__candidate__v1.json",
        "id": "advance-qa__week-07-q046",
        "difficulty": "Medium",
        "prompt": "What is the water supply fixture unit (WFSU) value for a public flushometer valve?",
        "choices": [
            {"label": "A", "text": "5"},
            {"label": "B", "text": "6"},
            {"label": "C", "text": "10"},
            {"label": "D", "text": "25"},
        ],
        "answer_key": "C",
        "explanation_short": "RNPCP Table 6-5 lists a public flushometer valve at 10 WFSU.",
        "explanation_long": "This reviewer item aligns with RNPCP Table 6-5 on equivalent water supply fixture units, where the keyed value for a public flushometer valve is 10 WFSU.",
    },
]

BATCH2_ITEMS: list[dict[str, Any]] = [
    {
        "source_file": "advance-qa__week-04__mcq__candidate__v1.json",
        "id": "advance-qa__week-04-q005",
        "difficulty": "Easy",
        "prompt": "What device is located at the bottom of a tank to flush a water closet or similar fixture?",
        "choices": [
            {"label": "A", "text": "Flush tank"},
            {"label": "B", "text": "Flush valve"},
            {"label": "C", "text": "Flushometer tank"},
            {"label": "D", "text": "Flushometer valve"},
        ],
        "answer_key": "B",
        "explanation_short": "The flush valve is the tank component that releases water into the fixture.",
        "explanation_long": "A flush valve is located at the bottom of the tank and opens to discharge water into the water closet or similar fixture for flushing.",
    },
    {
        "source_file": "advance-qa__week-04__mcq__candidate__v1.json",
        "id": "advance-qa__week-04-q010",
        "difficulty": "Easy",
        "prompt": "What is the horizontal vent that connects one or more individual back vents with the vent stack or stack vent?",
        "choices": [
            {"label": "A", "text": "Branch vent"},
            {"label": "B", "text": "Branch"},
            {"label": "C", "text": "Loop vent"},
            {"label": "D", "text": "Circuit vent"},
        ],
        "answer_key": "A",
        "explanation_short": "A branch vent ties individual back vents into the main venting system.",
        "explanation_long": "A branch vent is the horizontal vent line that connects one or more individual back vents to the vent stack or stack vent.",
    },
    {
        "source_file": "advance-qa__week-04__mcq__candidate__v1.json",
        "id": "advance-qa__week-04-q046",
        "difficulty": "Medium",
        "prompt": "Where should a gravity grease interceptor not be installed?",
        "choices": [
            {"label": "A", "text": "In any part of a building where food is handled"},
            {"label": "B", "text": "In a laundry area"},
            {"label": "C", "text": "On the second floor"},
            {"label": "D", "text": "In a public area"},
        ],
        "answer_key": "A",
        "explanation_short": "Gravity grease interceptors should not be installed where food is handled.",
        "explanation_long": "The cited grease-interceptor guidance states that a gravity grease interceptor shall not be installed in any part of a building where food is handled.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q002",
        "difficulty": "Medium",
        "prompt": "A dosing tank shall have a capacity equal to what percentage of the interior capacity of the pipe to be dosed at one time?",
        "choices": [
            {"label": "A", "text": "30% to 50%"},
            {"label": "B", "text": "60% to 75%"},
            {"label": "C", "text": "80% to 95%"},
            {"label": "D", "text": "90% to 100%"},
        ],
        "answer_key": "B",
        "explanation_short": "Dosing tanks are sized at 60% to 75% of the pipe capacity being dosed.",
        "explanation_long": "Appendix guidance for disposal fields states that the dosing tank shall have a capacity equal to 60% to 75% of the interior capacity of the pipe to be dosed at one time.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q010",
        "difficulty": "Medium",
        "prompt": "What valve shall be installed before each water-supplied appliance, slip-joint supply, and nonmetallic fixture or appliance supply piping?",
        "choices": [
            {"label": "A", "text": "Fullway gate valve"},
            {"label": "B", "text": "Control gate valve"},
            {"label": "C", "text": "Single-control gate valve"},
            {"label": "D", "text": "Check valve"},
        ],
        "answer_key": "B",
        "explanation_short": "Control gate valves are required ahead of these water-supplied connections.",
        "explanation_long": "The referenced water-supply rule states that control gate valves shall be installed before each water-supplied appliance, slip-joint supply, and supply piping for nonmetallic fixtures and appliances.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q015",
        "difficulty": "Medium",
        "prompt": "Horizontal drainage lines connecting with other horizontal drainage lines shall enter through all of the following except:",
        "choices": [
            {"label": "A", "text": "45-degree wye branches"},
            {"label": "B", "text": "Combination wye and one-eighth bend branches"},
            {"label": "C", "text": "60-degree wye branches"},
            {"label": "D", "text": "Approved fittings of equivalent sweep"},
        ],
        "answer_key": "C",
        "explanation_short": "The code permits 45-degree wyes, combination wyes with one-eighth bends, or equivalent sweep fittings.",
        "explanation_long": "Horizontal drainage lines entering other horizontal drainage lines must use 45-degree wye branches, combination wye and one-eighth bend branches, or other approved fittings of equivalent sweep. A 60-degree wye branch is the exception.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q021",
        "difficulty": "Hard",
        "prompt": "What is the minimum net free opening required for the inlet section of a sand interceptor?",
        "choices": [
            {"label": "A", "text": "0.1 m2"},
            {"label": "B", "text": "0.2 m2"},
            {"label": "C", "text": "0.3 m2"},
            {"label": "D", "text": "0.4 m2"},
        ],
        "answer_key": "B",
        "explanation_short": "A sand interceptor needs at least 0.2 m2 net free opening at the inlet section.",
        "explanation_long": "The sand interceptor requirement states that the net free opening of the inlet section shall have a minimum area of 0.2 m2, with at least 610 mm depth under the invert of the outlet pipe.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q022",
        "difficulty": "Medium",
        "prompt": "Each grease trap shall have an approved water seal of not less than what depth, or the diameter of its outlet, whichever is greater?",
        "choices": [
            {"label": "A", "text": "26 mm"},
            {"label": "B", "text": "51 mm"},
            {"label": "C", "text": "64 mm"},
            {"label": "D", "text": "76 mm"},
        ],
        "answer_key": "B",
        "explanation_short": "The minimum grease-trap water seal is 51 mm.",
        "explanation_long": "Each grease trap shall have an approved water seal not less than 51 mm in depth or not less than the diameter of its outlet, whichever is greater.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q024",
        "difficulty": "Medium",
        "prompt": "At the lowest section of a conductor draining over a catch basin, storm drain, or storm sewer, what stronger material may be used for protection from damage?",
        "choices": [
            {"label": "A", "text": "Steel pipe"},
            {"label": "B", "text": "PVC pipe"},
            {"label": "C", "text": "Wrought iron pipe"},
            {"label": "D", "text": "Copper pipe"},
        ],
        "answer_key": "A",
        "explanation_short": "The lowest section may be protected with steel pipe or cast iron.",
        "explanation_long": "The rule for rainwater conductors allows the lowest section to be protected from damage by connecting a stronger material such as steel pipe or cast iron.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q028",
        "difficulty": "Medium",
        "prompt": "No building sewer shall be smaller than what diameter, and it shall not be less in size than the building drain?",
        "choices": [
            {"label": "A", "text": "75 mm"},
            {"label": "B", "text": "100 mm"},
            {"label": "C", "text": "125 mm"},
            {"label": "D", "text": "150 mm"},
        ],
        "answer_key": "D",
        "explanation_short": "The minimum size for a building sewer is 150 mm.",
        "explanation_long": "The cited house-drain and house-sewer provision states that no building sewer shall be smaller than 150 mm in diameter and it must not be smaller than the building drain.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q030",
        "difficulty": "Medium",
        "prompt": "Medical gas piping is most often joined by which method?",
        "choices": [
            {"label": "A", "text": "Pressure-lock connection"},
            {"label": "B", "text": "Flared joints"},
            {"label": "C", "text": "Compression fittings"},
            {"label": "D", "text": "Silver brazing"},
        ],
        "answer_key": "D",
        "explanation_short": "Medical gas copper piping is commonly joined by silver brazing.",
        "explanation_long": "Copper-to-copper joints for medical gas pipework are commonly brazed using a silver-containing brazing filler metal, so silver brazing is the keyed method here.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q036",
        "difficulty": "Easy",
        "prompt": "Which of the following is the exception to the rule that pipes shall be iron pipe size (IPS) with appropriate weight?",
        "choices": [
            {"label": "A", "text": "Iron"},
            {"label": "B", "text": "Steel"},
            {"label": "C", "text": "Lead"},
            {"label": "D", "text": "Copper"},
        ],
        "answer_key": "C",
        "explanation_short": "Iron, steel, brass, and copper follow iron pipe size; lead does not.",
        "explanation_long": "The material rule states that iron, steel, brass, and copper pipes shall be iron pipe size with appropriate weight. Lead is the exception among the listed choices.",
    },
    {
        "source_file": "advance-qa__week-06__mcq__candidate__v1.json",
        "id": "advance-qa__week-06-q046",
        "difficulty": "Easy",
        "prompt": "How high shall a vent stack extend above the roof?",
        "choices": [
            {"label": "A", "text": "15 cm"},
            {"label": "B", "text": "12 in"},
            {"label": "C", "text": "15 in"},
            {"label": "D", "text": "10 ft"},
        ],
        "answer_key": "A",
        "explanation_short": "A vent stack shall terminate at least 15 cm above the roof.",
        "explanation_long": "Each vent pipe or stack through the roof shall terminate vertically not less than 15 cm above the roof and not less than 0.3 m from any nearby vertical surface.",
    },
    {
        "source_file": "advance-qa__week-08__mcq__candidate__v1.json",
        "id": "advance-qa__week-08-q004",
        "difficulty": "Easy",
        "prompt": "How is water pollution that carries disease organisms most commonly corrected?",
        "choices": [
            {"label": "A", "text": "Filtration"},
            {"label": "B", "text": "Sedimentation"},
            {"label": "C", "text": "Chlorination"},
            {"label": "D", "text": "Coagulation"},
        ],
        "answer_key": "C",
        "explanation_short": "Chlorination is the standard correction for disease-carrying contamination in water.",
        "explanation_long": "The referenced water-quality correction table identifies chlorination as the correction for pollution or contamination in water that carries disease organisms.",
    },
    {
        "source_file": "advance-qa__week-08__mcq__candidate__v1.json",
        "id": "advance-qa__week-08-q008",
        "difficulty": "Easy",
        "prompt": "Which term describes a disease that occurs infrequently and irregularly?",
        "choices": [
            {"label": "A", "text": "Endemic"},
            {"label": "B", "text": "Epidemic"},
            {"label": "C", "text": "Sporadic"},
            {"label": "D", "text": "Pandemic"},
        ],
        "answer_key": "C",
        "explanation_short": "A sporadic disease occurs infrequently and irregularly.",
        "explanation_long": "Among the standard disease-occurrence terms, sporadic refers to a condition that appears infrequently and irregularly rather than maintaining a baseline pattern or spreading broadly.",
    },
    {
        "source_file": "advance-qa__week-10__mcq__candidate__v1.json",
        "id": "advance-qa__week-10-q001",
        "difficulty": "Easy",
        "prompt": "Solid angles are measured in which unit?",
        "choices": [
            {"label": "A", "text": "Mil"},
            {"label": "B", "text": "Radians"},
            {"label": "C", "text": "Steradians"},
            {"label": "D", "text": "Circular mils"},
        ],
        "answer_key": "C",
        "explanation_short": "A steradian is the SI unit for measuring solid angles.",
        "explanation_long": "Plane angles are measured in radians, while solid angles are measured in steradians.",
    },
    {
        "source_file": "advance-qa__week-10__mcq__candidate__v1.json",
        "id": "advance-qa__week-10-q047",
        "difficulty": "Easy",
        "prompt": "A value of 2.5 score is equivalent to how many years?",
        "choices": [
            {"label": "A", "text": "20 years"},
            {"label": "B", "text": "25 years"},
            {"label": "C", "text": "50 years"},
            {"label": "D", "text": "100 years"},
        ],
        "answer_key": "C",
        "explanation_short": "One score is equal to 20 years.",
        "explanation_long": "A score means 20 years. Therefore, 2.5 score equals 2.5 x 20 = 50 years.",
    },
]


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_source_questions(path: Path) -> dict[str, dict[str, Any]]:
    payload = _load_json(path)
    questions = payload.get("questions", [])
    return {
        item["id"]: item
        for item in questions
        if isinstance(item, dict) and isinstance(item.get("id"), str)
    }


def _resolve_source_path(source_name: str) -> Path:
    for candidate in (STAGING_DIR / "review" / source_name, STAGING_DIR / "published" / source_name):
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Source file not found in staging buckets: {source_name}")


def _build_question(item: dict[str, Any], source: dict[str, Any], batch_tag: str) -> dict[str, Any]:
    question = {
        "id": item["id"],
        "topic": source.get("topic") or "Sanitation, Plumbing Design and Installation",
        "subtopic": source.get("subtopic") or "Advance Q&A Curated",
        "difficulty": item["difficulty"],
        "prompt": item["prompt"],
        "choices": item["choices"],
        "answer_key": item["answer_key"],
        "explanation_short": item["explanation_short"],
        "explanation_long": item["explanation_long"],
        "tags": [
            *(source.get("tags") or []),
            "advance-qa-curated",
            batch_tag,
        ],
        "source_ref": source.get("source_ref"),
        "quality_flag": "verified",
    }
    labels = {choice["label"] for choice in question["choices"]}
    if question["answer_key"] not in labels:
        raise ValueError(f"Answer key mismatch for {question['id']}")
    if len(question["choices"]) != 4:
        raise ValueError(f"Expected 4 choices for {question['id']}")
    return question


def publish_curated_batch(
    output_name: str,
    items: list[dict[str, Any]],
    promotion_strategy: str,
    batch_tag: str,
) -> Path:
    source_cache: dict[str, dict[str, dict[str, Any]]] = {}
    questions: list[dict[str, Any]] = []
    source_files: set[str] = set()

    for item in items:
        source_name = str(item["source_file"])
        source_path = _resolve_source_path(source_name)
        source_files.add(str(source_path))
        if source_name not in source_cache:
            source_cache[source_name] = _load_source_questions(source_path)
        source = source_cache[source_name].get(str(item["id"]))
        if source is None:
            raise KeyError(f"Source question not found: {item['id']}")
        questions.append(_build_question(item, source, batch_tag))

    payload = {
        "metadata": {
            "generator": "scripts/publish_curated_mcqs.py",
            "generated_at": datetime.now(UTC).isoformat(),
            "promotion_strategy": promotion_strategy,
            "source_files": sorted(source_files),
            "question_count": len(questions),
            "notes": [
                "Each item was manually selected from the staged review queue.",
                "Prompt and choice text were lightly cleaned for launch-safe use.",
                "Only four-choice questions with confirmed answer keys were included.",
            ],
        },
        "questions": questions,
        "flashcards": [],
        "identification": [],
    }

    PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
    output_path = PUBLISHED_DIR / output_name
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return output_path


def main() -> None:
    print(
        publish_curated_batch(
            "advance_qa_curated_batch1.json",
            BATCH1_ITEMS,
            "Manual shortlist from review_queue Advance Q&A weeks 1, 2, 3, 5, and 7",
            "launch-batch-1",
        )
    )
    print(
        publish_curated_batch(
            "advance_qa_curated_batch2.json",
            BATCH2_ITEMS,
            "Manual shortlist from review_queue and publish_candidate Advance Q&A weeks 4, 6, and 8",
            "launch-batch-2",
        )
    )


if __name__ == "__main__":
    main()
