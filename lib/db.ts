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
    seedDatabase(db);
    globalThis.emsDatabase = db;
  }

  return globalThis.emsDatabase!;
}

function hashPhoneNumber(phoneNumber: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(phoneNumber, salt, 64).toString("hex");
  return { hash, salt };
}

function verifyPhoneNumber(
  phoneNumber: string,
  salt: string,
  storedHash: string,
) {
  const derivedHash = scryptSync(phoneNumber, salt, 64);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, storedBuffer);
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
      approved INTEGER NOT NULL DEFAULT 1
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
      const { hash, salt } = hashPhoneNumber(student.phoneNumber);
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
      INSERT INTO judges (name, expertise, approved) VALUES (?, ?, ?)
    `);

    const judges = [
      ["Sandeep Maharjan", "Innovation Lab", 1],
      ["Aastha Bhandari", "Design Review", 1],
      ["Prabin Oli", "Robotics Club", 1],
    ];

    for (const judge of judges) {
      insertJudge.run(...judge);
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
      (db.prepare(
        "SELECT id, registration_number FROM students",
      ).all() as Array<{ id: number; registration_number: string }>).map((row) => [
        row.registration_number,
        row.id,
      ]),
    );

    const judgeMap = Object.fromEntries(
      (db.prepare("SELECT id, name FROM judges").all() as Array<{
        id: number;
        name: string;
      }>).map((row) => [row.name, row.id]),
    );

    const eventMap = Object.fromEntries(
      (db.prepare("SELECT id, name FROM events").all() as Array<{
        id: number;
        name: string;
      }>).map((row) => [row.name, row.id]),
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
        insertMetric.run(eventMap[eventName], ...metric);
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
        insertRule.run(eventMap[eventName], rule);
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
      insertEventJudge.run(eventMap[eventName], judgeMap[judgeName]);
    }

    const insertApplication = db.prepare(`
      INSERT INTO applications (student_id, event_id, status, team_name, applied_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertApplication.run(
      studentMap["202300302"],
      eventMap["Solo UI Challenge"],
      "approved",
      null,
      "2026-04-19T09:00:00",
    );
    insertApplication.run(
      studentMap["202300114"],
      eventMap["Innovation Sprint"],
      "pending",
      "Pixel Pilots",
      "2026-04-19T09:40:00",
    );
    insertApplication.run(
      studentMap["202300221"],
      eventMap["Innovation Sprint"],
      "approved",
      "Circuit Breakers",
      "2026-04-19T10:15:00",
    );
    insertApplication.run(
      studentMap["202300188"],
      eventMap["Robo Relay"],
      "approved",
      "Torque Three",
      "2026-04-19T11:00:00",
    );
    insertApplication.run(
      studentMap["202300114"],
      eventMap["Robo Relay"],
      "waitlisted",
      "Relay Lab",
      "2026-04-20T08:10:00",
    );

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
      eventMap["Solo UI Challenge"],
      studentMap["202300302"],
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
      eventMap["Solo UI Challenge"],
      studentMap["202300302"],
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
      eventMap["Innovation Sprint"],
      studentMap["202300221"],
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
      eventMap["Innovation Sprint"],
      studentMap["202300221"],
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
      eventMap["Robo Relay"],
      studentMap["202300188"],
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

export function authenticateStudent(
  registrationNumber: string,
  phoneNumber: string,
) {
  const student = getStudentByRegistrationNumber(registrationNumber);

  if (!student) {
    return null;
  }

  if (!verifyPhoneNumber(phoneNumber, student.phone_salt, student.phone_hash)) {
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

  const studentApplications = studentId
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
      }>).map((row) => ({
        id: row.id,
        eventName: row.event_name,
        eventType: row.event_type,
        status: row.status,
        teamName: row.team_name,
        appliedAt: row.applied_at,
      }))
    : [];

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

  db.prepare(
    `
      INSERT INTO applications (student_id, event_id, status, team_name, applied_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `,
  ).run(student.id, eventId, status, normalizedTeamName);

  return status;
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
