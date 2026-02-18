/**
 * PlumberPass - Master Plumber Licensure Exam Question Bank
 * Philippine Professional Regulation Commission (PRC) Standards
 * @version 1.0.0
 */

// Sample question bank for development and testing
// In production, this would be loaded from a backend API or IndexedDB

const QUESTIONS = [
  // ============================================
  // PLUMBING FUNDAMENTALS - CODES & STANDARDS
  // ============================================
  {
    id: "plumb-fund-001",
    topic: "Plumbing Fundamentals",
    subtopic: "Codes & Standards",
    difficulty: "Easy",
    prompt: "According to the National Plumbing Code of the Philippines, what is the minimum trap seal depth for a floor drain?",
    choices: [
      { label: "A", text: "25 mm (1 inch)" },
      { label: "B", text: "50 mm (2 inches)" },
      { label: "C", text: "75 mm (3 inches)" },
      { label: "D", text: "100 mm (4 inches)" }
    ],
    answer_key: "B",
    explanation_short: "The National Plumbing Code requires a minimum 50mm (2 inches) trap seal.",
    explanation_long: "The National Plumbing Code of the Philippines specifies a minimum trap seal of 50mm (2 inches) for floor drains. This depth is sufficient to prevent sewer gases from entering the building while allowing proper drainage flow. Trap seals less than 50mm may evaporate quickly, while excessive depths can cause siphonage.",
    tags: ["codes", "traps", "floor-drains"],
    source_ref: "NPCP Section 1002.0",
    quality_flag: "verified"
  },
  {
    id: "plumb-fund-002",
    topic: "Plumbing Fundamentals",
    subtopic: "Codes & Standards",
    difficulty: "Medium",
    prompt: "What is the minimum horizontal distance required between a water supply well and a septic tank absorption field?",
    choices: [
      { label: "A", text: "15 meters" },
      { label: "B", text: "30 meters" },
      { label: "C", text: "50 meters" },
      { label: "D", text: "100 meters" }
    ],
    answer_key: "C",
    explanation_short: "The minimum distance is 50 meters to prevent contamination.",
    explanation_long: "The National Plumbing Code requires a minimum horizontal distance of 50 meters between a water supply well and a septic tank absorption field. This separation distance is critical to prevent bacterial and nitrate contamination of potable water sources. The distance may need to be increased based on soil permeability and groundwater conditions.",
    tags: ["codes", "septic", "water-supply", "health"],
    source_ref: "NPCP Section 1503.2",
    quality_flag: "verified"
  },
  {
    id: "plumb-fund-003",
    topic: "Plumbing Fundamentals",
    subtopic: "Safety",
    difficulty: "Easy",
    prompt: "What color is used to identify compressed air lines in plumbing systems?",
    choices: [
      { label: "A", text: "Red" },
      { label: "B", text: "Blue" },
      { label: "C", text: "Yellow" },
      { label: "D", text: "Green" }
    ],
    answer_key: "D",
    explanation_short: "Green is the standard color for compressed air lines.",
    explanation_long: "Following standard safety color codes, compressed air lines are identified with green. Red typically indicates fire protection, blue indicates potable water, and yellow indicates gas lines. Proper color coding helps prevent accidents during maintenance and emergencies.",
    tags: ["safety", "color-codes", "compressed-air"],
    source_ref: "ASME A13.1",
    quality_flag: "verified"
  },

  // ============================================
  // WATER SUPPLY
  // ============================================
  {
    id: "water-sup-001",
    topic: "Water Supply",
    subtopic: "Pipe Sizing",
    difficulty: "Medium",
    prompt: "Using the Hunter Curve method, how many fixture units are equivalent to one water closet with flush valve?",
    choices: [
      { label: "A", text: "2 fixture units" },
      { label: "B", text: "4 fixture units" },
      { label: "C", text: "6 fixture units" },
      { label: "D", text: "10 fixture units" }
    ],
    answer_key: "D",
    explanation_short: "A water closet with flush valve equals 10 fixture units.",
    explanation_long: "According to the Hunter's method for estimating water demand, a water closet with a flush valve (flushometer) is assigned 10 fixture units. This high value reflects the instantaneous high flow rate of flush valves compared to flush tank toilets, which are only 5 fixture units. This distinction is crucial for proper pipe sizing.",
    tags: ["water-supply", "sizing", "fixture-units", "hunters-curve"],
    source_ref: "NPCP Appendix A",
    quality_flag: "verified"
  },
  {
    id: "water-sup-002",
    topic: "Water Supply",
    subtopic: "Pressure",
    difficulty: "Hard",
    prompt: "What is the minimum pressure required at the highest fixture in a building to ensure adequate flow?",
    choices: [
      { label: "A", text: "69 kPa (10 psi)" },
      { label: "B", text: "138 kPa (20 psi)" },
      { label: "C", text: "207 kPa (30 psi)" },
      { label: "D", text: "276 kPa (40 psi)" }
    ],
    answer_key: "B",
    explanation_short: "Minimum 138 kPa (20 psi) is required at the highest fixture.",
    explanation_long: "The National Plumbing Code requires a minimum pressure of 138 kPa (20 psi) at the highest fixture to ensure adequate flow. However, for optimal performance, especially with modern low-flow fixtures, 207-276 kPa (30-40 psi) is recommended. Pressure below 69 kPa (10 psi) is considered inadequate for any fixture.",
    tags: ["water-supply", "pressure", "fixtures"],
    source_ref: "NPCP Section 604.3",
    quality_flag: "verified"
  },
  {
    id: "water-sup-003",
    topic: "Water Supply",
    subtopic: "Valves",
    difficulty: "Easy",
    prompt: "Which type of valve is most suitable for throttling (flow control) service in water lines?",
    choices: [
      { label: "A", text: "Gate valve" },
      { label: "B", text: "Globe valve" },
      { label: "C", text: "Check valve" },
      { label: "D", text: "Ball valve" }
    ],
    answer_key: "B",
    explanation_short: "Globe valves are designed for throttling service.",
    explanation_long: "Globe valves are the best choice for throttling service because their design allows for precise flow control. The disk moves perpendicular to the flow, creating variable resistance. Gate valves should not be used for throttling as partial opening causes vibration and damage. Ball valves are primarily for on/off service.",
    tags: ["water-supply", "valves", "throttling"],
    source_ref: "Plumbing Engineering Design Handbook",
    quality_flag: "verified"
  },

  // ============================================
  // DRAINAGE & SANITARY
  // ============================================
  {
    id: "drain-001",
    topic: "Drainage & Sanitary",
    subtopic: "Venting",
    difficulty: "Medium",
    prompt: "What is the maximum developed length of a 2-inch vent pipe serving as a wet vent for a bathroom group?",
    choices: [
      { label: "A", text: "1.5 meters" },
      { label: "B", text: "3.0 meters" },
      { label: "C", text: "4.5 meters" },
      { label: "D", text: "6.0 meters" }
    ],
    answer_key: "C",
    explanation_short: "Maximum 4.5 meters for a 2-inch wet vent.",
    explanation_long: "The National Plumbing Code limits the developed length of a 2-inch wet vent serving a bathroom group to 4.5 meters (approximately 15 feet). This limitation ensures adequate venting capacity and prevents excessive pressure fluctuations that could compromise trap seals. Larger diameter vents or individual vents may be used for longer distances.",
    tags: ["drainage", "venting", "wet-vent", "bathroom-group"],
    source_ref: "NPCP Section 910.0",
    quality_flag: "verified"
  },
  {
    id: "drain-002",
    topic: "Drainage & Sanitary",
    subtopic: "Slope",
    difficulty: "Easy",
    prompt: "What is the minimum slope required for a 4-inch diameter horizontal sanitary drainage pipe?",
    choices: [
      { label: "A", text: "1/8 inch per foot (1%)" },
      { label: "B", text: "1/4 inch per foot (2%)" },
      { label: "C", text: "1/2 inch per foot (4%)" },
      { label: "D", text: "3/4 inch per foot (6%)" }
    ],
    answer_key: "B",
    explanation_short: "1/4 inch per foot (2%) minimum slope required.",
    explanation_long: "Horizontal sanitary drainage pipes require a minimum slope of 1/4 inch per foot (approximately 2% or 1:50) to ensure proper drainage velocity. This slope balances self-cleansing velocity (preventing solids deposition) with flow capacity. Smaller pipes (less than 3 inches) require 1/2 inch per foot minimum slope.",
    tags: ["drainage", "slope", "installation"],
    source_ref: "NPCP Table 704.1",
    quality_flag: "verified"
  },
  {
    id: "drain-003",
    topic: "Drainage & Sanitary",
    subtopic: "Cleanouts",
    difficulty: "Medium",
    prompt: "What is the maximum spacing of cleanouts along a horizontal drainage pipe running in a straight line?",
    choices: [
      { label: "A", text: "10 meters" },
      { label: "B", text: "15 meters" },
      { label: "C", text: "20 meters" },
      { label: "D", text: "30 meters" }
    ],
    answer_key: "B",
    explanation_short: "Maximum 15 meters between cleanouts.",
    explanation_long: "The National Plumbing Code requires cleanouts to be installed at maximum intervals of 15 meters (approximately 50 feet) along straight runs of drainage piping. Cleanouts must also be provided at each change of direction greater than 45 degrees. This ensures accessibility for maintenance and blockage removal.",
    tags: ["drainage", "cleanouts", "maintenance"],
    source_ref: "NPCP Section 708.0",
    quality_flag: "verified"
  },

  // ============================================
  // STORM DRAINAGE
  // ============================================
  {
    id: "storm-001",
    topic: "Storm Drainage",
    subtopic: "Roof Drains",
    difficulty: "Medium",
    prompt: "What is the minimum number of roof drains required for a roof area of 500 square meters?",
    choices: [
      { label: "A", text: "1 drain" },
      { label: "B", text: "2 drains" },
      { label: "C", text: "3 drains" },
      { label: "D", text: "4 drains" }
    ],
    answer_key: "B",
    explanation_short: "Minimum 2 drains required for redundancy.",
    explanation_long: "For roof areas between 300-900 square meters, a minimum of 2 roof drains is required. This provides redundancy in case one drain becomes blocked. Additionally, each drain should have an individual conductor leading to the storm drainage system. Large roofs require more drains based on rainfall intensity calculations.",
    tags: ["storm-drainage", "roof-drains", "design"],
    source_ref: "NPCP Section 1106.0",
    quality_flag: "verified"
  },

  // ============================================
  // FIXTURES
  // ============================================
  {
    id: "fixture-001",
    topic: "Fixtures",
    subtopic: "Water Closets",
    difficulty: "Easy",
    prompt: "What is the minimum trap size for a water closet?",
    choices: [
      { label: "A", text: "1.5 inches" },
      { label: "B", text: "2 inches" },
      { label: "C", text: "3 inches" },
      { label: "D", text: "4 inches" }
    ],
    answer_key: "C",
    explanation_short: "3-inch minimum trap size for water closets.",
    explanation_long: "Water closets require a minimum 3-inch trap. This larger size accommodates the rapid discharge from flush tanks or flush valves and prevents clogging. The fixture drain must also be minimum 3 inches and connect to a branch drain of at least 3 inches diameter.",
    tags: ["fixtures", "water-closet", "traps"],
    source_ref: "NPCP Table 702.1",
    quality_flag: "verified"
  },

  // ============================================
  // MATERIALS
  // ============================================
  {
    id: "mat-001",
    topic: "Materials",
    subtopic: "Pipes",
    difficulty: "Medium",
    prompt: "Which pipe material has the highest coefficient of thermal expansion?",
    choices: [
      { label: "A", text: "Copper" },
      { label: "B", text: "PVC (Polyvinyl Chloride)" },
      { label: "C", text: "Cast Iron" },
      { label: "D", text: "Galvanized Steel" }
    ],
    answer_key: "B",
    explanation_short: "PVC has the highest thermal expansion coefficient.",
    explanation_long: "PVC has a coefficient of thermal expansion approximately 5 times greater than copper and 10 times greater than steel. This significant expansion requires special consideration for expansion loops, offsets, or expansion joints in hot water applications and in exposed installations subject to temperature variations.",
    tags: ["materials", "pvc", "thermal-expansion"],
    source_ref: "Plumbing Engineering Design Handbook",
    quality_flag: "verified"
  },

  // ============================================
  // SPECIALIZED SYSTEMS
  // ============================================
  {
    id: "spec-001",
    topic: "Specialized Systems",
    subtopic: "Fire Suppression",
    difficulty: "Hard",
    prompt: "In a wet pipe fire suppression system, what is the minimum residual pressure required at the highest sprinkler head?",
    choices: [
      { label: "A", text: "0.5 bar (7 psi)" },
      { label: "B", text: "0.7 bar (10 psi)" },
      { label: "C", text: "1.0 bar (15 psi)" },
      { label: "D", text: "1.5 bar (22 psi)" }
    ],
    answer_key: "B",
    explanation_short: "Minimum 0.7 bar (10 psi) at highest sprinkler.",
    explanation_long: "NFPA 13 requires a minimum residual pressure of 0.7 bar (10 psi) at the highest sprinkler head in a wet pipe system. This ensures proper spray pattern and coverage. Light hazard occupancies typically require 4.1 bar (60 psi) at the base of the riser, with friction loss and elevation head calculated for the highest head.",
    tags: ["fire-suppression", "sprinklers", "nfpa-13"],
    source_ref: "NFPA 13",
    quality_flag: "verified"
  }
];

// Make questions available globally
if (typeof window !== 'undefined') {
  window.QUESTIONS = QUESTIONS;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTIONS };
}
