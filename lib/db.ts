import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type EventType = "individual" | "team";
export type ApplicationStatus =
  | "pending"
  | "approved"
  | "waitlisted"
  | "withdrawn"
  | "rejected";
export type ScoreStatus = "draft" | "validated" | "locked" | "disqualified";

export type DashboardStat = {
  label: string;
  value: string;
  detail: string;
};

export type TeamMember = {
  name: string;
  registrationNumber: string | null;
  isCaptain: boolean;
};

export type EventCard = {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  teamSize: number;
  maxParticipants: number;
  status: string;
  startAt: string;
  endAt: string;
  ruleSummary: string;
  applicationCount: number;
  judges: string[];
  advancementRules: string[];
  rubricMetrics: Array<{
    name: string;
    weight: number;
  }>;
  userApplicationStatus: ApplicationStatus | null;
};

export type StudentProfile = {
  id: number;
  name: string;
  registrationNumber: string;
  semester: string;
  email: string;
};

export type StudentApplication = {
  id: number;
  eventName: string;
  eventType: EventType;
  status: ApplicationStatus;
  teamName: string | null;
  appliedAt: string;
  teamMembers: TeamMember[];
};

export type StudentScore = {
  id: number;
  eventName: string;
  roundName: string;
  judgeName: string;
  status: ScoreStatus;
  weightedTotal: number;
  adminNotes: string;
};

export type LeaderboardEntry = {
  eventName: string;
  participantName: string;
  registrationNumber: string;
  score: number;
  latestRound: string;
};

export type ParticipantSubEvent = {
  id: number;
  name: string;
  parentEventName: string;
  status: string;
  startAt: string;
  endAt: string;
  maxTeams: number;
  currentTeams: number;
  teamName: string;
  teamMembers: TeamMember[];
  hasEntered: boolean;
};

export type AdminEventOverview = {
  id: number;
  name: string;
  eventType: EventType;
  teamSize: number;
  maxParticipants: number;
  status: string;
  startAt: string;
  endAt: string;
  judges: string[];
  advancementRules: string[];
};

export type AdminApplication = {
  id: number;
  studentName: string;
  registrationNumber: string;
  eventName: string;
  status: ApplicationStatus;
  teamName: string | null;
  appliedAt: string;
};

export type ScoreValidationItem = {
  id: number;
  eventName: string;
  roundName: string;
  participantName: string;
  judgeName: string;
  weightedTotal: number;
  status: ScoreStatus;
  adminNotes: string;
};

export type JudgeProfile = {
  id: number;
  name: string;
  username: string;
  expertise: string;
};

export type JudgeAssignedEvent = {
  id: number;
  name: string;
  eventType: EventType;
  startAt: string;
  endAt: string;
  pendingDraftCount: number;
  approvedParticipantCount: number;
  subEventCount: number;
  rubricMetrics: Array<{
    name: string;
    weight: number;
  }>;
};

export type JudgeScoringItem = {
  applicationId: number;
  eventId: number;
  eventName: string;
  participantName: string;
  registrationNumber: string;
  teamName: string | null;
  teamMembers: TeamMember[];
  roundName: string;
  status: ScoreStatus | null;
  weightedTotal: number | null;
  adminNotes: string;
  metricValues: [number, number, number, number, number];
  rubricMetrics: Array<{
    name: string;
    weight: number;
  }>;
};

export type JudgeSubEventEntry = {
  id: number;
  subEventName: string;
  eventName: string;
  teamName: string;
  enteredAt: string;
  teamMembers: TeamMember[];
};

declare global {
  var emsDatabase: DatabaseSync | undefined;
}

type CountRow = { count: number };
type StudentRow = {
  id: number;
  name: string;
  registration_number: string;
  semester: string;
  email: string;
  phone_hash: string;
  phone_salt: string;
};

type JudgeRow = {
  id: number;
  name: string;
  expertise: string;
  approved: number;
  username: string | null;
  login_code_hash: string | null;
  login_code_salt: string | null;
};

type EventRow = {
  id: number;
  name: string;
  description: string;
  event_type: EventType;
  team_size: number;
  max_participants: number;
  status: string;
  start_at: string;
  end_at: string;
  rule_summary: string;
};

type DraftRow = {
  id: number;
  status: ScoreStatus;
  weighted_total: number;
  admin_notes: string;
  round_name: string;
  metric_1: number;
  metric_2: number;
  metric_3: number;
  metric_4: number;
  metric_5: number;
};

const SEEDED_JUDGE_CREDENTIALS: Record<
  string,
  { username: string; accessCode: string }
> = {
  "Sandeep Maharjan": {
    username: "sandeep.judge",
    accessCode: "JUDGE1001",
  },
  "Aastha Bhandari": {
    username: "aastha.judge",
    accessCode: "JUDGE1002",
  },
  "Prabin Oli": {
    username: "prabin.judge",
    accessCode: "JUDGE1003",
  },
};

const SEEDED_TEAM_MEMBERS: Record<
  string,
  Array<{ name: string; registrationNumber: string | null; isCaptain?: boolean }>
> = {
  "Pixel Pilots": [
    { name: "Aakriti Sharma", registrationNumber: "202300114", isCaptain: true },
    { name: "Nirajan Shrestha", registrationNumber: null },
    { name: "Mina Adhikari", registrationNumber: null },
    { name: "Sajina Koirala", registrationNumber: null },
  ],
  "Circuit Breakers": [
    { name: "Rohan Gurung", registrationNumber: "202300221", isCaptain: true },
    { name: "Anish Tiwari", registrationNumber: null },
    { name: "Supriya KC", registrationNumber: null },
    { name: "Bikram Ale", registrationNumber: null },
  ],
  "Torque Three": [
    { name: "Priya Karki", registrationNumber: "202300188", isCaptain: true },
    { name: "Roshan Rai", registrationNumber: null },
    { name: "Sujan Khadka", registrationNumber: null },
  ],
  "Relay Lab": [
    { name: "Aakriti Sharma", registrationNumber: "202300114", isCaptain: true },
    { name: "Sonia Bista", registrationNumber: null },
    { name: "Amit Basnet", registrationNumber: null },
  ],
};

function databaseFilePath() {
  const directory = path.join(process.cwd(), "data");
  mkdirSync(directory, { recursive: true });
  return path.join(directory, "ems.sqlite");
}

function getDatabase() {
  if (!globalThis.emsDatabase) {
    const db = new DatabaseSync(databaseFilePath());
    db.exec("PRAGMA foreign_keys = ON;");
    initializeSchema(db);
    migrateSchema(db);
    seedDatabase(db);
    hydrateDatabase(db);
    globalThis.emsDatabase = db;
  }

  return globalThis.emsDatabase!;
}

function hashSecret(secret: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(secret, salt, 64).toString("hex");
  return { hash, salt };
}

function verifySecret(secret: string, salt: string, storedHash: string) {
  const derivedHash = scryptSync(secret, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, storedBuffer);
}

function normalizeIdentifier(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE,
      semester TEXT NOT NULL,
      email TEXT NOT NULL,
      phone_hash TEXT NOT NULL,
      phone_salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS judges (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      expertise TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 1,
      username TEXT,
      login_code_hash TEXT,
      login_code_salt TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('individual', 'team')),
      team_size INTEGER NOT NULL,
      max_participants INTEGER NOT NULL,
      status TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      rule_summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rubric_metrics (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      metric_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      weight INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS advancement_rules (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      rule_text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_judges (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'waitlisted', 'withdrawn', 'rejected')),
      team_name TEXT,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS application_team_members (
      id INTEGER PRIMARY KEY,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      member_name TEXT NOT NULL,
      member_registration_number TEXT,
      is_captain INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sub_events (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      max_teams INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sub_event_entries (
      id INTEGER PRIMARY KEY,
      sub_event_id INTEGER NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      entered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(sub_event_id, application_id)
    );

    CREATE TABLE IF NOT EXISTS score_drafts (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      judge_id INTEGER NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
      round_name TEXT NOT NULL,
      metric_1 INTEGER NOT NULL,
      metric_2 INTEGER NOT NULL,
      metric_3 INTEGER NOT NULL,
      metric_4 INTEGER NOT NULL,
      metric_5 INTEGER NOT NULL,
      weighted_total REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft', 'validated', 'locked', 'disqualified')),
      admin_notes TEXT NOT NULL,
      validated_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getColumnNames(db: DatabaseSync, tableName: string) {
  return new Set(
    (
      db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
        name: string;
      }>
    ).map((row) => row.name),
  );
}

function addColumnIfMissing(
  db: DatabaseSync,
  tableName: string,
  columnName: string,
  definition: string,
) {
  if (!getColumnNames(db, tableName).has(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function migrateSchema(db: DatabaseSync) {
  addColumnIfMissing(db, "judges", "username", "TEXT");
  addColumnIfMissing(db, "judges", "login_code_hash", "TEXT");
  addColumnIfMissing(db, "judges", "login_code_salt", "TEXT");

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_judges_username
      ON judges(username);
    CREATE INDEX IF NOT EXISTS idx_application_team_members_application
      ON application_team_members(application_id);
    CREATE INDEX IF NOT EXISTS idx_sub_events_event
      ON sub_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_sub_event_entries_sub_event
      ON sub_event_entries(sub_event_id);
  `);
}

function seedDatabase(db: DatabaseSync) {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM students").get() as CountRow;

  if (existing.count > 0) {
    return;
  }

  db.exec("BEGIN");

  try {
    const insertStudent = db.prepare(`
      INSERT INTO students (
        name,
        registration_number,
        semester,
        email,
        phone_hash,
        phone_salt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const students = [
      {
        name: "Nikchaya Lamsal",
        registrationNumber: "202300302",
        semester: "5th Semester",
        email: "nikchaya.lamsal@ems.local",
        phoneNumber: "8436715819",
      },
      {
        name: "Aakriti Sharma",
        registrationNumber: "202300114",
        semester: "6th Semester",
        email: "aakriti.sharma@ems.local",
        phoneNumber: "9811122233",
      },
      {
        name: "Rohan Gurung",
        registrationNumber: "202300221",
        semester: "4th Semester",
        email: "rohan.gurung@ems.local",
        phoneNumber: "9800012345",
      },
      {
        name: "Priya Karki",
        registrationNumber: "202300188",
        semester: "7th Semester",
        email: "priya.karki@ems.local",
        phoneNumber: "9819988877",
      },
    ];

    for (const student of students) {
      const { hash, salt } = hashSecret(student.phoneNumber);
      insertStudent.run(
        student.name,
        student.registrationNumber,
        student.semester,
        student.email,
        hash,
        salt,
      );
    }

    const insertJudge = db.prepare(`
      INSERT INTO judges (
        name,
        expertise,
        approved,
        username,
        login_code_hash,
        login_code_salt
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const judges = [
      ["Sandeep Maharjan", "Innovation Lab", 1],
      ["Aastha Bhandari", "Design Review", 1],
      ["Prabin Oli", "Robotics Club", 1],
    ] as const;

    for (const [name, expertise, approved] of judges) {
      const credentials = SEEDED_JUDGE_CREDENTIALS[name];
      const { hash, salt } = hashSecret(credentials.accessCode);
      insertJudge.run(name, expertise, approved, credentials.username, hash, salt);
    }

    const insertEvent = db.prepare(`
      INSERT INTO events (
        name,
        description,
        event_type,
        team_size,
        max_participants,
        status,
        start_at,
        end_at,
        rule_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const events = [
      [
        "Solo UI Challenge",
        "Individual design showdown for rapid interface concepts and visual clarity.",
        "individual",
        1,
        60,
        "Open",
        "2026-05-02T09:00:00",
        "2026-05-02T11:00:00",
        "Rules can be attached as text or PDF. Judges score drafts first, then admin validates and locks.",
      ],
      [
        "Innovation Sprint",
        "Team-based product sprint with campus problem solving, pitching, and scoring.",
        "team",
        4,
        12,
        "Open",
        "2026-05-02T12:30:00",
        "2026-05-02T16:00:00",
        "Admin controls event mode, team size, and capacity. Absence means disqualification.",
      ],
      [
        "Robo Relay",
        "Hardware and strategy relay with timed checkpoints and strict round completion.",
        "team",
        3,
        10,
        "Open",
        "2026-05-03T10:00:00",
        "2026-05-03T13:00:00",
        "All judges submit before round completion. Admin validates final score drafts.",
      ],
    ] as const;

    for (const event of events) {
      insertEvent.run(...event);
    }

    const studentMap = Object.fromEntries(
      (db.prepare("SELECT id, registration_number, name FROM students").all() as Array<{
        id: number;
        registration_number: string;
        name: string;
      }>).map((row) => [row.registration_number, row]),
    );

    const judgeMap = Object.fromEntries(
      (db.prepare("SELECT id, name FROM judges").all() as Array<{
        id: number;
        name: string;
      }>).map((row) => [row.name, row.id]),
    );

    const eventMap = Object.fromEntries(
      (db.prepare("SELECT id, name, event_type, max_participants FROM events").all() as Array<{
        id: number;
        name: string;
        event_type: EventType;
        max_participants: number;
      }>).map((row) => [row.name, row]),
    );

    const insertMetric = db.prepare(`
      INSERT INTO rubric_metrics (event_id, metric_order, name, weight)
      VALUES (?, ?, ?, ?)
    `);

    const eventMetrics: Record<string, Array<[number, string, number]>> = {
      "Solo UI Challenge": [
        [1, "Visual clarity", 20],
        [2, "Usability", 20],
        [3, "Originality", 20],
        [4, "Execution", 20],
        [5, "Rules compliance", 20],
      ],
      "Innovation Sprint": [
        [1, "Problem framing", 15],
        [2, "Innovation", 25],
        [3, "Feasibility", 20],
        [4, "Pitch delivery", 20],
        [5, "Team coordination", 20],
      ],
      "Robo Relay": [
        [1, "Speed", 25],
        [2, "Reliability", 20],
        [3, "Strategy", 20],
        [4, "Execution", 20],
        [5, "Safety compliance", 15],
      ],
    };

    for (const [eventName, metrics] of Object.entries(eventMetrics)) {
      for (const metric of metrics) {
        insertMetric.run(eventMap[eventName].id, ...metric);
      }
    }

    const insertRule = db.prepare(`
      INSERT INTO advancement_rules (event_id, rule_text) VALUES (?, ?)
    `);

    const rules: Record<string, string[]> = {
      "Solo UI Challenge": [
        "Judges define the advancement threshold before scoring starts.",
        "Absence in any round is recorded as disqualification.",
      ],
      "Innovation Sprint": [
        "Common advancement criteria are shared across all judges on the event.",
        "Top teams after cumulative scoring move forward unless disqualified.",
      ],
      "Robo Relay": [
        "Round completion stays blocked until all assigned judges submit draft scores.",
        "Admin validates each submitted draft before the round is locked.",
      ],
    };

    for (const [eventName, eventRules] of Object.entries(rules)) {
      for (const rule of eventRules) {
        insertRule.run(eventMap[eventName].id, rule);
      }
    }

    const insertEventJudge = db.prepare(`
      INSERT INTO event_judges (event_id, judge_id) VALUES (?, ?)
    `);

    const assignments: Array<[string, string]> = [
      ["Solo UI Challenge", "Sandeep Maharjan"],
      ["Solo UI Challenge", "Aastha Bhandari"],
      ["Innovation Sprint", "Sandeep Maharjan"],
      ["Innovation Sprint", "Prabin Oli"],
      ["Robo Relay", "Aastha Bhandari"],
      ["Robo Relay", "Prabin Oli"],
    ];

    for (const [eventName, judgeName] of assignments) {
      insertEventJudge.run(eventMap[eventName].id, judgeMap[judgeName]);
    }

    const insertApplication = db.prepare(`
      INSERT INTO applications (student_id, event_id, status, team_name, applied_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertApplication.run(
      studentMap["202300302"].id,
      eventMap["Solo UI Challenge"].id,
      "approved",
      null,
      "2026-04-19T09:00:00",
    );
    insertApplication.run(
      studentMap["202300114"].id,
      eventMap["Innovation Sprint"].id,
      "pending",
      "Pixel Pilots",
      "2026-04-19T09:40:00",
    );
    insertApplication.run(
      studentMap["202300221"].id,
      eventMap["Innovation Sprint"].id,
      "approved",
      "Circuit Breakers",
      "2026-04-19T10:15:00",
    );
    insertApplication.run(
      studentMap["202300188"].id,
      eventMap["Robo Relay"].id,
      "approved",
      "Torque Three",
      "2026-04-19T11:00:00",
    );
    insertApplication.run(
      studentMap["202300114"].id,
      eventMap["Robo Relay"].id,
      "waitlisted",
      "Relay Lab",
      "2026-04-20T08:10:00",
    );

    const applications = db.prepare(`
      SELECT
        applications.id,
        applications.team_name,
        students.name AS student_name,
        students.registration_number
      FROM applications
      INNER JOIN students ON students.id = applications.student_id
      WHERE applications.team_name IS NOT NULL
    `).all() as Array<{
      id: number;
      team_name: string;
      student_name: string;
      registration_number: string;
    }>;

    for (const application of applications) {
      const members =
        SEEDED_TEAM_MEMBERS[application.team_name] ?? [
          {
            name: application.student_name,
            registrationNumber: application.registration_number,
            isCaptain: true,
          },
        ];
      insertTeamMembers(db, application.id, members);
    }

    backfillDefaultSubEvents(db);

    const subEventMap = Object.fromEntries(
      (db.prepare("SELECT id, event_id, name FROM sub_events").all() as Array<{
        id: number;
        event_id: number;
        name: string;
      }>).map((row) => [`${row.event_id}:${row.name}`, row.id]),
    );

    const approvedApplications = db.prepare(`
      SELECT id, event_id, team_name
      FROM applications
      WHERE status = 'approved' AND team_name IS NOT NULL
    `).all() as Array<{ id: number; event_id: number; team_name: string }>;

    const insertSubEventEntry = db.prepare(`
      INSERT INTO sub_event_entries (sub_event_id, application_id, entered_at)
      VALUES (?, ?, ?)
    `);

    const subEventSeeds: Array<{ eventName: string; subEventName: string; teamName: string; enteredAt: string }> = [
      {
        eventName: "Innovation Sprint",
        subEventName: "Qualifier Round",
        teamName: "Circuit Breakers",
        enteredAt: "2026-04-21T08:30:00",
      },
      {
        eventName: "Robo Relay",
        subEventName: "Qualifier Round",
        teamName: "Torque Three",
        enteredAt: "2026-04-21T08:45:00",
      },
    ];

    for (const seed of subEventSeeds) {
      const eventId = eventMap[seed.eventName].id;
      const application = approvedApplications.find(
        (item) => item.event_id === eventId && item.team_name === seed.teamName,
      );

      if (application) {
        insertSubEventEntry.run(
          subEventMap[`${eventId}:${seed.subEventName}`],
          application.id,
          seed.enteredAt,
        );
      }
    }

    const insertScore = db.prepare(`
      INSERT INTO score_drafts (
        event_id,
        student_id,
        judge_id,
        round_name,
        metric_1,
        metric_2,
        metric_3,
        metric_4,
        metric_5,
        weighted_total,
        status,
        admin_notes,
        validated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertScore.run(
      eventMap["Solo UI Challenge"].id,
      studentMap["202300302"].id,
      judgeMap["Sandeep Maharjan"],
      "Round 1",
      8,
      9,
      8,
      9,
      8,
      42,
      "draft",
      "Judge draft submitted. Pending admin validation before lock.",
      null,
    );
    insertScore.run(
      eventMap["Solo UI Challenge"].id,
      studentMap["202300302"].id,
      judgeMap["Aastha Bhandari"],
      "Round 1",
      8,
      8,
      9,
      8,
      9,
      42,
      "validated",
      "Admin validated the draft. Ready for final lock once all drafts are checked.",
      "2026-04-21T12:00:00",
    );
    insertScore.run(
      eventMap["Innovation Sprint"].id,
      studentMap["202300221"].id,
      judgeMap["Prabin Oli"],
      "Round 1",
      9,
      9,
      8,
      9,
      8,
      43.5,
      "locked",
      "Validated and locked after admin review.",
      "2026-04-21T13:20:00",
    );
    insertScore.run(
      eventMap["Innovation Sprint"].id,
      studentMap["202300221"].id,
      judgeMap["Sandeep Maharjan"],
      "Round 1",
      8,
      9,
      8,
      8,
      9,
      42,
      "validated",
      "Final review passed. Waiting for lock.",
      "2026-04-21T13:45:00",
    );
    insertScore.run(
      eventMap["Robo Relay"].id,
      studentMap["202300188"].id,
      judgeMap["Aastha Bhandari"],
      "Round 1",
      0,
      0,
      0,
      0,
      0,
      0,
      "disqualified",
      "Participant absent. Disqualified per event rules.",
      "2026-04-21T09:00:00",
    );

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function hydrateDatabase(db: DatabaseSync) {
  db.exec("BEGIN");

  try {
    ensureJudgeCredentials(db);
    backfillTeamMembers(db);
    backfillDefaultSubEvents(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function ensureJudgeCredentials(db: DatabaseSync) {
  const judges = db.prepare(`
    SELECT id, name, expertise, approved, username, login_code_hash, login_code_salt
    FROM judges
  `).all() as JudgeRow[];

  const updateJudge = db.prepare(`
    UPDATE judges
    SET username = ?, login_code_hash = ?, login_code_salt = ?
    WHERE id = ?
  `);

  for (const judge of judges) {
    const credentials = SEEDED_JUDGE_CREDENTIALS[judge.name] ?? {
      username: normalizeIdentifier(judge.name || `judge-${judge.id}`),
      accessCode: `JUDGE${String(3000 + judge.id)}`,
    };

    if (judge.username && judge.login_code_hash && judge.login_code_salt) {
      continue;
    }

    const { hash, salt } = hashSecret(credentials.accessCode);
    updateJudge.run(credentials.username, hash, salt, judge.id);
  }
}

function insertTeamMembers(
  db: DatabaseSync,
  applicationId: number,
  members: Array<{
    name: string;
    registrationNumber: string | null;
    isCaptain?: boolean;
  }>,
) {
  db.prepare("DELETE FROM application_team_members WHERE application_id = ?").run(
    applicationId,
  );

  const insertMember = db.prepare(`
    INSERT INTO application_team_members (
      application_id,
      member_name,
      member_registration_number,
      is_captain
    ) VALUES (?, ?, ?, ?)
  `);

  for (const member of members) {
    insertMember.run(
      applicationId,
      member.name,
      member.registrationNumber,
      member.isCaptain ? 1 : 0,
    );
  }
}

function buildTeamMemberRoster(
  captain: StudentRow,
  teammateNames: string[],
  teamSize: number,
) {
  const seen = new Set<string>();
  const roster: Array<{ name: string; registrationNumber: string | null; isCaptain: boolean }> = [];

  roster.push({
    name: captain.name,
    registrationNumber: captain.registration_number,
    isCaptain: true,
  });
  seen.add(captain.name.trim().toLowerCase());

  for (const teammateName of teammateNames) {
    const normalized = teammateName.trim();

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    roster.push({
      name: normalized,
      registrationNumber: null,
      isCaptain: false,
    });
    seen.add(key);
  }

  if (roster.length > teamSize) {
    throw new Error("team-size-exceeded");
  }

  return roster;
}

function backfillTeamMembers(db: DatabaseSync) {
  const rows = db.prepare(`
    SELECT
      applications.id,
      applications.team_name,
      students.name AS student_name,
      students.registration_number
    FROM applications
    INNER JOIN events ON events.id = applications.event_id
    INNER JOIN students ON students.id = applications.student_id
    WHERE events.event_type = 'team'
      AND applications.team_name IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM application_team_members
        WHERE application_team_members.application_id = applications.id
      )
  `).all() as Array<{
    id: number;
    team_name: string;
    student_name: string;
    registration_number: string;
  }>;

  for (const row of rows) {
    const members =
      SEEDED_TEAM_MEMBERS[row.team_name] ?? [
        {
          name: row.student_name,
          registrationNumber: row.registration_number,
          isCaptain: true,
        },
      ];
    insertTeamMembers(db, row.id, members);
  }
}

function backfillDefaultSubEvents(db: DatabaseSync) {
  const teamEvents = db.prepare(`
    SELECT id, name, description, event_type, team_size, max_participants, status, start_at, end_at, rule_summary
    FROM events
    WHERE event_type = 'team'
  `).all() as EventRow[];

  const existingCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sub_events
    WHERE event_id = ?
  `);

  const insertSubEvent = db.prepare(`
    INSERT INTO sub_events (
      event_id,
      name,
      description,
      start_at,
      end_at,
      status,
      max_teams
    ) VALUES (?, ?, ?, ?, ?, 'Open', ?)
  `);

  for (const event of teamEvents) {
    const count = existingCount.get(event.id) as CountRow;

    if (count.count > 0) {
      continue;
    }

    insertSubEvent.run(
      event.id,
      "Qualifier Round",
      `Qualified teams from ${event.name} can confirm their round entry here.`,
      event.start_at,
      event.end_at,
      event.max_participants,
    );
    insertSubEvent.run(
      event.id,
      "Final Showcase",
      `Top ${event.name} teams progress here after the qualifier review.`,
      event.start_at,
      event.end_at,
      Math.max(1, Math.floor(event.max_participants / 2)),
    );
  }
}

function getEventJudges(eventId: number) {
  const db = getDatabase();
  return (db
    .prepare(
      `
        SELECT judges.name
        FROM event_judges
        INNER JOIN judges ON judges.id = event_judges.judge_id
        WHERE event_judges.event_id = ?
        ORDER BY judges.name ASC
      `,
    )
    .all(eventId) as Array<{ name: string }>).map((row) => row.name);
}

function getAdvancementRules(eventId: number) {
  const db = getDatabase();
  return (db
    .prepare(
      "SELECT rule_text FROM advancement_rules WHERE event_id = ? ORDER BY id ASC",
    )
    .all(eventId) as Array<{ rule_text: string }>).map((row) => row.rule_text);
}

function getRubricMetrics(eventId: number) {
  const db = getDatabase();
  return (
    db.prepare(
      `
        SELECT name, weight
        FROM rubric_metrics
        WHERE event_id = ?
        ORDER BY metric_order ASC
      `,
    ).all(eventId) as Array<{ name: string; weight: number }>
  ).map((row) => ({
    name: row.name,
    weight: row.weight,
  }));
}

function getTeamMembersByApplicationIds(applicationIds: number[]) {
  const db = getDatabase();
  const map = new Map<number, TeamMember[]>();

  if (applicationIds.length === 0) {
    return map;
  }

  const placeholders = applicationIds.map(() => "?").join(", ");
  const rows = db.prepare(
    `
      SELECT
        application_id,
        member_name,
        member_registration_number,
        is_captain
      FROM application_team_members
      WHERE application_id IN (${placeholders})
      ORDER BY application_id ASC, is_captain DESC, id ASC
    `,
  ).all(...applicationIds) as Array<{
    application_id: number;
    member_name: string;
    member_registration_number: string | null;
    is_captain: number;
  }>;

  for (const row of rows) {
    const current = map.get(row.application_id) ?? [];
    current.push({
      name: row.member_name,
      registrationNumber: row.member_registration_number,
      isCaptain: row.is_captain === 1,
    });
    map.set(row.application_id, current);
  }

  return map;
}

function getStudentByRegistrationNumber(registrationNumber: string) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
          id,
          name,
          registration_number,
          semester,
          email,
          phone_hash,
          phone_salt
        FROM students
        WHERE registration_number = ?
      `,
    )
    .get(registrationNumber) as StudentRow | undefined;
}

function getJudgeByUsername(username: string) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
          id,
          name,
          expertise,
          approved,
          username,
          login_code_hash,
          login_code_salt
        FROM judges
        WHERE username = ?
      `,
    )
    .get(username) as JudgeRow | undefined;
}

function getEventById(eventId: number) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
          id,
          name,
          description,
          event_type,
          team_size,
          max_participants,
          status,
          start_at,
          end_at,
          rule_summary
        FROM events
        WHERE id = ?
      `,
    )
    .get(eventId) as EventRow | undefined;
}

function getLatestJudgeDraft(judgeId: number, eventId: number, studentId: number) {
  const db = getDatabase();
  return db
    .prepare(
      `
        SELECT
          id,
          status,
          weighted_total,
          admin_notes,
          round_name,
          metric_1,
          metric_2,
          metric_3,
          metric_4,
          metric_5
        FROM score_drafts
        WHERE judge_id = ? AND event_id = ? AND student_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
    )
    .get(judgeId, eventId, studentId) as DraftRow | undefined;
}

function calculateWeightedTotal(
  rubricMetrics: Array<{ name: string; weight: number }>,
  metricValues: [number, number, number, number, number],
) {
  return rubricMetrics.reduce((total, metric, index) => {
    return total + metricValues[index] * (metric.weight / 20);
  }, 0);
}

export function authenticateStudent(
  registrationNumber: string,
  phoneNumber: string,
) {
  const student = getStudentByRegistrationNumber(registrationNumber);

  if (!student) {
    return null;
  }

  if (!verifySecret(phoneNumber, student.phone_salt, student.phone_hash)) {
    return null;
  }

  return {
    id: student.id,
    name: student.name,
    registrationNumber: student.registration_number,
    semester: student.semester,
    email: student.email,
  } satisfies StudentProfile;
}

export function authenticateJudge(username: string, accessCode: string) {
  const judge = getJudgeByUsername(normalizeIdentifier(username));

  if (
    !judge ||
    judge.approved !== 1 ||
    !judge.login_code_hash ||
    !judge.login_code_salt
  ) {
    return null;
  }

  if (!verifySecret(accessCode, judge.login_code_salt, judge.login_code_hash)) {
    return null;
  }

  return {
    id: judge.id,
    name: judge.name,
    username: judge.username ?? normalizeIdentifier(judge.name),
    expertise: judge.expertise,
  } satisfies JudgeProfile;
}

export function getHomeData(registrationNumber: string | null) {
  const db = getDatabase();
  const student =
    registrationNumber === null
      ? null
      : (() => {
          const row = getStudentByRegistrationNumber(registrationNumber);

          if (!row) {
            return null;
          }

          return {
            id: row.id,
            name: row.name,
            registrationNumber: row.registration_number,
            semester: row.semester,
            email: row.email,
          } satisfies StudentProfile;
        })();

  const studentId = student?.id ?? null;
  const userApplications = studentId
    ? Object.fromEntries(
        (
          db
            .prepare(
              `
                SELECT event_id, status
                FROM applications
                WHERE student_id = ?
              `,
            )
            .all(studentId) as Array<{ event_id: number; status: ApplicationStatus }>
        ).map((row) => [row.event_id, row.status]),
      )
    : {};

  const events = (
    db.prepare(
      `
        SELECT
          events.id,
          events.name,
          events.description,
          events.event_type,
          events.team_size,
          events.max_participants,
          events.status,
          events.start_at,
          events.end_at,
          events.rule_summary,
          COUNT(applications.id) AS application_count
        FROM events
        LEFT JOIN applications
          ON applications.event_id = events.id
          AND applications.status IN ('pending', 'approved', 'waitlisted')
        GROUP BY events.id
        ORDER BY events.start_at ASC
      `,
    ).all() as Array<
      EventRow & {
        application_count: number;
      }
    >
  ).map((event) => ({
    id: event.id,
    name: event.name,
    description: event.description,
    eventType: event.event_type,
    teamSize: event.team_size,
    maxParticipants: event.max_participants,
    status: event.status,
    startAt: event.start_at,
    endAt: event.end_at,
    ruleSummary: event.rule_summary,
    applicationCount: event.application_count,
    judges: getEventJudges(event.id),
    advancementRules: getAdvancementRules(event.id),
    rubricMetrics: getRubricMetrics(event.id),
    userApplicationStatus:
      userApplications[event.id] === undefined ? null : userApplications[event.id],
  })) satisfies EventCard[];

  const studentApplicationRows = studentId
    ? (db
        .prepare(
          `
            SELECT
              applications.id,
              events.name AS event_name,
              events.event_type AS event_type,
              applications.status,
              applications.team_name,
              applications.applied_at
            FROM applications
            INNER JOIN events ON events.id = applications.event_id
            WHERE applications.student_id = ?
            ORDER BY applications.applied_at DESC
          `,
        )
        .all(studentId) as Array<{
        id: number;
        event_name: string;
        event_type: EventType;
        status: ApplicationStatus;
        team_name: string | null;
        applied_at: string;
      }>)
    : [];

  const teamMemberMap = getTeamMembersByApplicationIds(
    studentApplicationRows.map((application) => application.id),
  );

  const studentApplications = studentApplicationRows.map((row) => ({
    id: row.id,
    eventName: row.event_name,
    eventType: row.event_type,
    status: row.status,
    teamName: row.team_name,
    appliedAt: row.applied_at,
    teamMembers: teamMemberMap.get(row.id) ?? [],
  })) satisfies StudentApplication[];

  const studentScores = studentId
    ? (db
        .prepare(
          `
            SELECT
              score_drafts.id,
              events.name AS event_name,
              score_drafts.round_name,
              judges.name AS judge_name,
              score_drafts.status,
              score_drafts.weighted_total,
              score_drafts.admin_notes
            FROM score_drafts
            INNER JOIN events ON events.id = score_drafts.event_id
            INNER JOIN judges ON judges.id = score_drafts.judge_id
            WHERE score_drafts.student_id = ?
            ORDER BY score_drafts.created_at DESC
          `,
        )
        .all(studentId) as Array<{
        id: number;
        event_name: string;
        round_name: string;
        judge_name: string;
        status: ScoreStatus;
        weighted_total: number;
        admin_notes: string;
      }>).map((row) => ({
        id: row.id,
        eventName: row.event_name,
        roundName: row.round_name,
        judgeName: row.judge_name,
        status: row.status,
        weightedTotal: row.weighted_total,
        adminNotes: row.admin_notes,
      }))
    : [];

  const availableSubEvents = studentId
    ? (db
        .prepare(
          `
            SELECT
              sub_events.id,
              sub_events.name,
              sub_events.status,
              sub_events.start_at,
              sub_events.end_at,
              sub_events.max_teams,
              events.name AS parent_event_name,
              applications.id AS application_id,
              applications.team_name,
              COUNT(sub_event_entries_all.id) AS current_teams,
              MAX(CASE WHEN sub_event_entries_own.id IS NOT NULL THEN 1 ELSE 0 END) AS has_entered
            FROM applications
            INNER JOIN events ON events.id = applications.event_id
            INNER JOIN sub_events ON sub_events.event_id = events.id
            LEFT JOIN sub_event_entries AS sub_event_entries_own
              ON sub_event_entries_own.sub_event_id = sub_events.id
              AND sub_event_entries_own.application_id = applications.id
            LEFT JOIN sub_event_entries AS sub_event_entries_all
              ON sub_event_entries_all.sub_event_id = sub_events.id
            WHERE applications.student_id = ?
              AND applications.status = 'approved'
              AND events.event_type = 'team'
              AND applications.team_name IS NOT NULL
            GROUP BY sub_events.id, applications.id
            ORDER BY sub_events.start_at ASC, sub_events.id ASC
          `,
        )
        .all(studentId) as Array<{
        id: number;
        name: string;
        status: string;
        start_at: string;
        end_at: string;
        max_teams: number;
        parent_event_name: string;
        application_id: number;
        team_name: string;
        current_teams: number;
        has_entered: number;
      }>)
    : [];

  const subEvents = availableSubEvents.map((row) => ({
    id: row.id,
    name: row.name,
    parentEventName: row.parent_event_name,
    status: row.status,
    startAt: row.start_at,
    endAt: row.end_at,
    maxTeams: row.max_teams,
    currentTeams: row.current_teams,
    teamName: row.team_name,
    teamMembers: teamMemberMap.get(row.application_id) ?? [],
    hasEntered: row.has_entered === 1,
  })) satisfies ParticipantSubEvent[];

  const leaderboard = (
    db.prepare(
      `
        SELECT
          events.name AS event_name,
          students.name AS participant_name,
          students.registration_number,
          ROUND(AVG(score_drafts.weighted_total), 1) AS score,
          MAX(score_drafts.round_name) AS latest_round
        FROM score_drafts
        INNER JOIN events ON events.id = score_drafts.event_id
        INNER JOIN students ON students.id = score_drafts.student_id
        WHERE score_drafts.status IN ('validated', 'locked')
        GROUP BY events.id, students.id
        ORDER BY score DESC, latest_round DESC
        LIMIT 5
      `,
    ).all() as Array<{
      event_name: string;
      participant_name: string;
      registration_number: string;
      score: number;
      latest_round: string;
    }>
  ).map((row) => ({
    eventName: row.event_name,
    participantName: row.participant_name,
    registrationNumber: row.registration_number,
    score: row.score,
    latestRound: row.latest_round,
  })) satisfies LeaderboardEntry[];

  const totalEvents = db.prepare("SELECT COUNT(*) AS count FROM events").get() as CountRow;
  const totalPendingApplications = db
    .prepare(
      "SELECT COUNT(*) AS count FROM applications WHERE status IN ('pending', 'waitlisted')",
    )
    .get() as CountRow;
  const draftScores = db
    .prepare("SELECT COUNT(*) AS count FROM score_drafts WHERE status = 'draft'")
    .get() as CountRow;
  const approvedJudges = db
    .prepare("SELECT COUNT(*) AS count FROM judges WHERE approved = 1")
    .get() as CountRow;

  const stats: DashboardStat[] = [
    {
      label: "Live events",
      value: String(totalEvents.count),
      detail: "Team and individual events share one control plane.",
    },
    {
      label: "Pending approvals",
      value: String(totalPendingApplications.count),
      detail: "Applications stay pending until admin or judges approve them.",
    },
    {
      label: "Draft scores",
      value: String(draftScores.count),
      detail: "Judges submit drafts first, then admin validates and locks.",
    },
    {
      label: "Approved judges",
      value: String(approvedJudges.count),
      detail: "Every active event is mapped to approved judges only.",
    },
  ];

  return {
    stats,
    student,
    events,
    leaderboard,
    studentApplications,
    studentScores,
    subEvents,
  };
}

export function getJudgeDashboard(username: string | null) {
  const db = getDatabase();
  const judgeRow = username ? getJudgeByUsername(username) : null;

  if (!judgeRow || judgeRow.approved !== 1 || !judgeRow.username) {
    return {
      judge: null,
      stats: [] as DashboardStat[],
      assignments: [] as JudgeAssignedEvent[],
      scoringQueue: [] as JudgeScoringItem[],
      subEventEntries: [] as JudgeSubEventEntry[],
    };
  }

  const assignedEvents = db.prepare(
    `
      SELECT
        events.id,
        events.name,
        events.event_type,
        events.start_at,
        events.end_at,
        (
          SELECT COUNT(*)
          FROM score_drafts
          WHERE score_drafts.event_id = events.id
            AND score_drafts.judge_id = ?
            AND score_drafts.status = 'draft'
        ) AS pending_draft_count,
        (
          SELECT COUNT(*)
          FROM applications
          WHERE applications.event_id = events.id
            AND applications.status = 'approved'
        ) AS approved_participant_count,
        (
          SELECT COUNT(*)
          FROM sub_events
          WHERE sub_events.event_id = events.id
        ) AS sub_event_count
      FROM event_judges
      INNER JOIN events ON events.id = event_judges.event_id
      WHERE event_judges.judge_id = ?
      ORDER BY events.start_at ASC
    `,
  ).all(judgeRow.id, judgeRow.id) as Array<{
    id: number;
    name: string;
    event_type: EventType;
    start_at: string;
    end_at: string;
    pending_draft_count: number;
    approved_participant_count: number;
    sub_event_count: number;
  }>;

  const assignments = assignedEvents.map((event) => ({
    id: event.id,
    name: event.name,
    eventType: event.event_type,
    startAt: event.start_at,
    endAt: event.end_at,
    pendingDraftCount: event.pending_draft_count,
    approvedParticipantCount: event.approved_participant_count,
    subEventCount: event.sub_event_count,
    rubricMetrics: getRubricMetrics(event.id),
  })) satisfies JudgeAssignedEvent[];

  const scoringRows = db.prepare(
    `
      SELECT
        applications.id AS application_id,
        applications.event_id,
        applications.team_name,
        students.id AS student_id,
        students.name AS participant_name,
        students.registration_number,
        events.name AS event_name
      FROM event_judges
      INNER JOIN events ON events.id = event_judges.event_id
      INNER JOIN applications ON applications.event_id = events.id
      INNER JOIN students ON students.id = applications.student_id
      WHERE event_judges.judge_id = ?
        AND applications.status = 'approved'
      ORDER BY events.start_at ASC, applications.applied_at ASC
    `,
  ).all(judgeRow.id) as Array<{
    application_id: number;
    event_id: number;
    team_name: string | null;
    student_id: number;
    participant_name: string;
    registration_number: string;
    event_name: string;
  }>;

  const memberMap = getTeamMembersByApplicationIds(
    scoringRows.map((row) => row.application_id),
  );

  const scoringQueue = scoringRows.map((row) => {
    const latestDraft = getLatestJudgeDraft(judgeRow.id, row.event_id, row.student_id);
    return {
      applicationId: row.application_id,
      eventId: row.event_id,
      eventName: row.event_name,
      participantName: row.participant_name,
      registrationNumber: row.registration_number,
      teamName: row.team_name,
      teamMembers: memberMap.get(row.application_id) ?? [],
      roundName: latestDraft?.round_name ?? "Round 1",
      status: latestDraft?.status ?? null,
      weightedTotal: latestDraft?.weighted_total ?? null,
      adminNotes: latestDraft?.admin_notes ?? "",
      metricValues: [
        latestDraft?.metric_1 ?? 0,
        latestDraft?.metric_2 ?? 0,
        latestDraft?.metric_3 ?? 0,
        latestDraft?.metric_4 ?? 0,
        latestDraft?.metric_5 ?? 0,
      ] as [number, number, number, number, number],
      rubricMetrics: getRubricMetrics(row.event_id),
    };
  }) satisfies JudgeScoringItem[];

  const subEventRows = db.prepare(
    `
      SELECT
        sub_event_entries.id,
        sub_events.name AS sub_event_name,
        events.name AS event_name,
        applications.id AS application_id,
        applications.team_name,
        sub_event_entries.entered_at
      FROM event_judges
      INNER JOIN events ON events.id = event_judges.event_id
      INNER JOIN sub_events ON sub_events.event_id = events.id
      INNER JOIN sub_event_entries ON sub_event_entries.sub_event_id = sub_events.id
      INNER JOIN applications ON applications.id = sub_event_entries.application_id
      WHERE event_judges.judge_id = ?
      ORDER BY sub_event_entries.entered_at DESC
    `,
  ).all(judgeRow.id) as Array<{
    id: number;
    sub_event_name: string;
    event_name: string;
    application_id: number;
    team_name: string;
    entered_at: string;
  }>;

  const subEventEntries = subEventRows.map((row) => ({
    id: row.id,
    subEventName: row.sub_event_name,
    eventName: row.event_name,
    teamName: row.team_name,
    enteredAt: row.entered_at,
    teamMembers: memberMap.get(row.application_id) ?? [],
  })) satisfies JudgeSubEventEntry[];

  const stats: DashboardStat[] = [
    {
      label: "Assigned events",
      value: String(assignments.length),
      detail: "Only events mapped to this judge are visible here.",
    },
    {
      label: "Pending drafts",
      value: String(assignments.reduce((sum, item) => sum + item.pendingDraftCount, 0)),
      detail: "Drafts stay editable until admin validates or locks them.",
    },
    {
      label: "Approved entries",
      value: String(assignments.reduce((sum, item) => sum + item.approvedParticipantCount, 0)),
      detail: "Approved participants are ready for scoring or round review.",
    },
    {
      label: "Sub-event teams",
      value: String(subEventEntries.length),
      detail: "Team entries include roster visibility for each sub-event.",
    },
  ];

  return {
    judge: {
      id: judgeRow.id,
      name: judgeRow.name,
      username: judgeRow.username,
      expertise: judgeRow.expertise,
    } satisfies JudgeProfile,
    stats,
    assignments,
    scoringQueue,
    subEventEntries,
  };
}

export function getAdminDashboard() {
  const db = getDatabase();
  const homeData = getHomeData(null);

  const events = (
    db.prepare(
      `
        SELECT
          id,
          name,
          event_type,
          team_size,
          max_participants,
          status,
          start_at,
          end_at
        FROM events
        ORDER BY start_at ASC
      `,
    ).all() as Array<{
      id: number;
      name: string;
      event_type: EventType;
      team_size: number;
      max_participants: number;
      status: string;
      start_at: string;
      end_at: string;
    }>
  ).map((event) => ({
    id: event.id,
    name: event.name,
    eventType: event.event_type,
    teamSize: event.team_size,
    maxParticipants: event.max_participants,
    status: event.status,
    startAt: event.start_at,
    endAt: event.end_at,
    judges: getEventJudges(event.id),
    advancementRules: getAdvancementRules(event.id),
  })) satisfies AdminEventOverview[];

  const applications = (
    db.prepare(
      `
        SELECT
          applications.id,
          students.name AS student_name,
          students.registration_number,
          events.name AS event_name,
          applications.status,
          applications.team_name,
          applications.applied_at
        FROM applications
        INNER JOIN students ON students.id = applications.student_id
        INNER JOIN events ON events.id = applications.event_id
        ORDER BY applications.applied_at DESC
      `,
    ).all() as Array<{
      id: number;
      student_name: string;
      registration_number: string;
      event_name: string;
      status: ApplicationStatus;
      team_name: string | null;
      applied_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    studentName: row.student_name,
    registrationNumber: row.registration_number,
    eventName: row.event_name,
    status: row.status,
    teamName: row.team_name,
    appliedAt: row.applied_at,
  })) satisfies AdminApplication[];

  const validationQueue = (
    db.prepare(
      `
        SELECT
          score_drafts.id,
          events.name AS event_name,
          score_drafts.round_name,
          students.name AS participant_name,
          judges.name AS judge_name,
          score_drafts.weighted_total,
          score_drafts.status,
          score_drafts.admin_notes
        FROM score_drafts
        INNER JOIN events ON events.id = score_drafts.event_id
        INNER JOIN students ON students.id = score_drafts.student_id
        INNER JOIN judges ON judges.id = score_drafts.judge_id
        ORDER BY
          CASE score_drafts.status
            WHEN 'draft' THEN 0
            WHEN 'validated' THEN 1
            WHEN 'locked' THEN 2
            ELSE 3
          END,
          score_drafts.created_at DESC
      `,
    ).all() as Array<{
      id: number;
      event_name: string;
      round_name: string;
      participant_name: string;
      judge_name: string;
      weighted_total: number;
      status: ScoreStatus;
      admin_notes: string;
    }>
  ).map((row) => ({
    id: row.id,
    eventName: row.event_name,
    roundName: row.round_name,
    participantName: row.participant_name,
    judgeName: row.judge_name,
    weightedTotal: row.weighted_total,
    status: row.status,
    adminNotes: row.admin_notes,
  })) satisfies ScoreValidationItem[];

  return {
    stats: homeData.stats,
    events,
    applications,
    validationQueue,
  };
}

export function createApplicationForStudent(
  registrationNumber: string,
  eventId: number,
  teamName: string | null,
  teamMemberNames: string[],
) {
  const db = getDatabase();
  const student = getStudentByRegistrationNumber(registrationNumber);
  const event = getEventById(eventId);

  if (!student || !event) {
    throw new Error("missing-record");
  }

  const existing = db
    .prepare(
      `
        SELECT id
        FROM applications
        WHERE student_id = ? AND event_id = ? AND status <> 'withdrawn'
      `,
    )
    .get(student.id, eventId) as { id: number } | undefined;

  if (existing) {
    throw new Error("already-applied");
  }

  const overlap = db
    .prepare(
      `
        SELECT events.name
        FROM applications
        INNER JOIN events ON events.id = applications.event_id
        WHERE applications.student_id = ?
          AND applications.status IN ('pending', 'approved', 'waitlisted')
          AND events.start_at < ?
          AND events.end_at > ?
        LIMIT 1
      `,
    )
    .get(student.id, event.end_at, event.start_at) as { name: string } | undefined;

  if (overlap) {
    throw new Error("schedule-conflict");
  }

  const activeCount = db
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM applications
        WHERE event_id = ? AND status IN ('pending', 'approved', 'waitlisted')
      `,
    )
    .get(eventId) as CountRow;

  const status: ApplicationStatus =
    activeCount.count >= event.max_participants ? "waitlisted" : "pending";

  const normalizedTeamName =
    event.event_type === "team"
      ? (teamName?.trim() || `${student.name.split(" ")[0]}'s Team`)
      : null;

  db.exec("BEGIN");

  try {
    const result = db
      .prepare(
        `
          INSERT INTO applications (student_id, event_id, status, team_name, applied_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `,
      )
      .run(student.id, eventId, status, normalizedTeamName);

    const applicationId = Number(result.lastInsertRowid);

    if (event.event_type === "team") {
      const roster = buildTeamMemberRoster(student, teamMemberNames, event.team_size);
      insertTeamMembers(db, applicationId, roster);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return status;
}

export function enterParticipantTeamIntoSubEvent(
  registrationNumber: string,
  subEventId: number,
) {
  const db = getDatabase();
  const student = getStudentByRegistrationNumber(registrationNumber);

  if (!student) {
    throw new Error("missing-record");
  }

  const application = db
    .prepare(
      `
        SELECT
          applications.id,
          applications.team_name,
          sub_events.max_teams,
          (
            SELECT COUNT(*)
            FROM sub_event_entries
            WHERE sub_event_entries.sub_event_id = sub_events.id
          ) AS current_teams
        FROM sub_events
        INNER JOIN events ON events.id = sub_events.event_id
        INNER JOIN applications ON applications.event_id = events.id
        WHERE sub_events.id = ?
          AND applications.student_id = ?
          AND applications.status = 'approved'
          AND events.event_type = 'team'
          AND applications.team_name IS NOT NULL
      `,
    )
    .get(subEventId, student.id) as
    | {
        id: number;
        team_name: string;
        max_teams: number;
        current_teams: number;
      }
    | undefined;

  if (!application) {
    throw new Error("sub-event-not-available");
  }

  const existing = db
    .prepare(
      `
        SELECT id
        FROM sub_event_entries
        WHERE sub_event_id = ? AND application_id = ?
      `,
    )
    .get(subEventId, application.id) as { id: number } | undefined;

  if (existing) {
    throw new Error("already-entered-sub-event");
  }

  if (application.current_teams >= application.max_teams) {
    throw new Error("sub-event-full");
  }

  db.prepare(
    `
      INSERT INTO sub_event_entries (sub_event_id, application_id, entered_at)
      VALUES (?, ?, datetime('now'))
    `,
  ).run(subEventId, application.id);
}

export function createEvent(input: {
  name: string;
  description: string;
  eventType: EventType;
  teamSize: number;
  maxParticipants: number;
  startAt: string;
  endAt: string;
  ruleSummary: string;
}) {
  const db = getDatabase();
  const teamSize = input.eventType === "team" ? Math.max(input.teamSize, 2) : 1;
  const maxParticipants = Math.max(input.maxParticipants, 1);

  if (!input.name.trim() || !input.description.trim() || !input.ruleSummary.trim()) {
    throw new Error("invalid-event");
  }

  if (!input.startAt || !input.endAt || input.startAt >= input.endAt) {
    throw new Error("invalid-schedule");
  }

  db.exec("BEGIN");

  try {
    const result = db
      .prepare(
        `
          INSERT INTO events (
            name,
            description,
            event_type,
            team_size,
            max_participants,
            status,
            start_at,
            end_at,
            rule_summary
          ) VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?)
        `,
      )
      .run(
        input.name.trim(),
        input.description.trim(),
        input.eventType,
        teamSize,
        maxParticipants,
        input.startAt,
        input.endAt,
        input.ruleSummary.trim(),
      );

    const eventId = Number(result.lastInsertRowid);
    const defaultMetrics = [
      "Execution",
      "Creativity",
      "Clarity",
      "Impact",
      "Rules compliance",
    ];
    const insertMetric = db.prepare(
      `
        INSERT INTO rubric_metrics (event_id, metric_order, name, weight)
        VALUES (?, ?, ?, ?)
      `,
    );

    defaultMetrics.forEach((metric, index) => {
      insertMetric.run(eventId, index + 1, metric, 20);
    });

    db.prepare(
      `
        INSERT INTO advancement_rules (event_id, rule_text) VALUES (?, ?)
      `,
    ).run(
      eventId,
      "Judges will finalize the shared advancement criteria before scoring starts. Absence means disqualification.",
    );

    if (input.eventType === "team") {
      db.prepare(
        `
          INSERT INTO sub_events (
            event_id,
            name,
            description,
            start_at,
            end_at,
            status,
            max_teams
          ) VALUES (?, ?, ?, ?, ?, 'Open', ?)
        `,
      ).run(
        eventId,
        "Qualifier Round",
        `Qualified teams from ${input.name.trim()} can confirm their round entry here.`,
        input.startAt,
        input.endAt,
        maxParticipants,
      );

      db.prepare(
        `
          INSERT INTO sub_events (
            event_id,
            name,
            description,
            start_at,
            end_at,
            status,
            max_teams
          ) VALUES (?, ?, ?, ?, ?, 'Open', ?)
        `,
      ).run(
        eventId,
        "Final Showcase",
        `Top ${input.name.trim()} teams progress here after the qualifier review.`,
        input.startAt,
        input.endAt,
        Math.max(1, Math.floor(maxParticipants / 2)),
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function submitJudgeScoreDraft(
  username: string,
  input: {
    applicationId: number;
    roundName: string;
    metricValues: [number, number, number, number, number];
    adminNotes: string;
  },
) {
  const db = getDatabase();
  const judge = getJudgeByUsername(username);

  if (!judge || judge.approved !== 1) {
    throw new Error("judge-access-required");
  }

  const application = db
    .prepare(
      `
        SELECT
          applications.event_id,
          applications.student_id,
          applications.status
        FROM applications
        INNER JOIN event_judges
          ON event_judges.event_id = applications.event_id
        WHERE applications.id = ?
          AND event_judges.judge_id = ?
      `,
    )
    .get(input.applicationId, judge.id) as
    | {
        event_id: number;
        student_id: number;
        status: ApplicationStatus;
      }
    | undefined;

  if (!application || application.status !== "approved") {
    throw new Error("invalid-score-target");
  }

  if (!input.roundName.trim()) {
    throw new Error("invalid-round");
  }

  const metricValues = input.metricValues.map((value) => Number(value)) as [
    number,
    number,
    number,
    number,
    number,
  ];

  if (metricValues.some((value) => Number.isNaN(value) || value < 0 || value > 10)) {
    throw new Error("invalid-metrics");
  }

  const rubricMetrics = getRubricMetrics(application.event_id);
  const weightedTotal = calculateWeightedTotal(rubricMetrics, metricValues);

  const existingDraft = db
    .prepare(
      `
        SELECT id, status
        FROM score_drafts
        WHERE judge_id = ?
          AND event_id = ?
          AND student_id = ?
          AND round_name = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
    )
    .get(
      judge.id,
      application.event_id,
      application.student_id,
      input.roundName.trim(),
    ) as { id: number; status: ScoreStatus } | undefined;

  if (existingDraft?.status === "locked") {
    throw new Error("score-locked");
  }

  if (existingDraft) {
    db.prepare(
      `
        UPDATE score_drafts
        SET metric_1 = ?,
            metric_2 = ?,
            metric_3 = ?,
            metric_4 = ?,
            metric_5 = ?,
            weighted_total = ?,
            status = 'draft',
            admin_notes = ?,
            validated_at = NULL
        WHERE id = ?
      `,
    ).run(
      metricValues[0],
      metricValues[1],
      metricValues[2],
      metricValues[3],
      metricValues[4],
      weightedTotal,
      input.adminNotes.trim() || "Judge draft submitted for admin review.",
      existingDraft.id,
    );
    return;
  }

  db.prepare(
    `
      INSERT INTO score_drafts (
        event_id,
        student_id,
        judge_id,
        round_name,
        metric_1,
        metric_2,
        metric_3,
        metric_4,
        metric_5,
        weighted_total,
        status,
        admin_notes,
        validated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NULL)
    `,
  ).run(
    application.event_id,
    application.student_id,
    judge.id,
    input.roundName.trim(),
    metricValues[0],
    metricValues[1],
    metricValues[2],
    metricValues[3],
    metricValues[4],
    weightedTotal,
    input.adminNotes.trim() || "Judge draft submitted for admin review.",
  );
}

export function validateScoreDraftById(draftId: number) {
  const db = getDatabase();
  db.prepare(
    `
      UPDATE score_drafts
      SET status = 'validated',
          validated_at = datetime('now'),
          admin_notes = 'Admin validated the judge draft. Ready for lock.'
      WHERE id = ? AND status = 'draft'
    `,
  ).run(draftId);
}

export function lockScoreDraftById(draftId: number) {
  const db = getDatabase();
  db.prepare(
    `
      UPDATE score_drafts
      SET status = 'locked',
          validated_at = COALESCE(validated_at, datetime('now')),
          admin_notes = 'Admin locked the validated score draft.'
      WHERE id = ? AND status IN ('draft', 'validated')
    `,
  ).run(draftId);
}
