export type ExamSubjectBlueprint = {
  name: string;
  weight: number;
  examDay: string;
  timeWindow: string;
  summary: string;
};

export type ExamBlueprint = {
  id: string;
  title: string;
  board: string;
  provider: string;
  jurisdiction: string;
  activeCycleId: string;
  cycles: ExamCycle[];
  examDate: string;
  examWindowLabel: string;
  applicationOpenDate: string;
  applicationDeadline: string;
  targetReleaseDate: string;
  testingCentersLabel: string;
  applicationFeeLabel: string;
  subjects: ExamSubjectBlueprint[];
};

export type ExamCycle = {
  id: string;
  examDate: string;
  examWindowLabel: string;
  applicationOpenDate: string;
  applicationDeadline: string;
  targetReleaseDate: string;
};

// Update this list as PRC publishes the next regular exam cycles.
export const MASTER_PLUMBER_EXAM_CYCLES: ExamCycle[] = [
  {
    id: "2026-july",
    examDate: "2026-07-11T00:00:00+08:00",
    examWindowLabel: "July 11-12, 2026",
    applicationOpenDate: "2026-04-13",
    applicationDeadline: "2026-06-11",
    targetReleaseDate: "2026-07-15",
  },
];

const ACTIVE_MASTER_PLUMBER_CYCLE_ID = "2026-july";
const ACTIVE_MASTER_PLUMBER_CYCLE =
  MASTER_PLUMBER_EXAM_CYCLES.find((cycle) => cycle.id === ACTIVE_MASTER_PLUMBER_CYCLE_ID) ??
  MASTER_PLUMBER_EXAM_CYCLES[0];

export const MASTER_PLUMBER_EXAM: ExamBlueprint = {
  id: `prc-master-plumber-${ACTIVE_MASTER_PLUMBER_CYCLE.id}`,
  title: "Master Plumber Licensure Examination",
  board: "Board for Master Plumbers",
  provider: "Professional Regulation Commission",
  jurisdiction: "Philippines",
  activeCycleId: ACTIVE_MASTER_PLUMBER_CYCLE.id,
  cycles: MASTER_PLUMBER_EXAM_CYCLES,
  examDate: ACTIVE_MASTER_PLUMBER_CYCLE.examDate,
  examWindowLabel: ACTIVE_MASTER_PLUMBER_CYCLE.examWindowLabel,
  applicationOpenDate: ACTIVE_MASTER_PLUMBER_CYCLE.applicationOpenDate,
  applicationDeadline: ACTIVE_MASTER_PLUMBER_CYCLE.applicationDeadline,
  targetReleaseDate: ACTIVE_MASTER_PLUMBER_CYCLE.targetReleaseDate,
  testingCentersLabel:
    "NCR, Baguio, Butuan, Cagayan de Oro, Cebu, Davao, Iloilo, Koronadal, Legazpi, Lucena, Pagadian, Rosales, Tacloban, and Tuguegarao",
  applicationFeeLabel: "PHP 600.00",
  subjects: [
    {
      name: "Plumbing Arithmetic",
      weight: 10,
      examDay: "Day 1",
      timeWindow: "8:00 A.M. - 10:00 A.M.",
      summary: "Core numeric work, conversions, hydraulics, and formula-based reasoning.",
    },
    {
      name: "Sanitation, Plumbing Design and Installation",
      weight: 40,
      examDay: "Day 1",
      timeWindow: "11:00 A.M. - 5:00 P.M.",
      summary: "System design, installation, sanitation principles, fixtures, and applied code usage.",
    },
    {
      name: "Plumbing Code",
      weight: 10,
      examDay: "Day 2",
      timeWindow: "8:00 A.M. - 10:00 A.M.",
      summary: "Direct code knowledge from the Revised National Plumbing Code and related rules.",
    },
    {
      name: "Practical Problems and Experiences",
      weight: 40,
      examDay: "Day 2",
      timeWindow: "11:00 A.M. - 5:00 P.M.",
      summary: "Applied field judgment, troubleshooting, sizing, sequencing, and work-experience scenarios.",
    },
  ],
};
