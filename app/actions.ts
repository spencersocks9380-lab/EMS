"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  readSessionJudgeUsername,
  readSessionRegistrationNumber,
} from "@/lib/auth";
import {
  authenticateJudge,
  authenticateStudent,
  createApplicationForStudent,
  createEvent,
  enterParticipantTeamIntoSubEvent,
  lockScoreDraftById,
  submitJudgeScoreDraft,
  validateScoreDraftById,
} from "@/lib/db";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseTeamMembers(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((member) => member.trim())
    .filter(Boolean);
}

async function storeSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set("ems_session", value, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function loginParticipant(formData: FormData) {
  const registrationNumber = readField(formData, "registrationNumber");
  const phoneNumber = readField(formData, "phoneNumber");
  const student = authenticateStudent(registrationNumber, phoneNumber);

  if (!student) {
    redirect("/?error=invalid-login#participant-login");
  }

  await storeSessionCookie(
    createSessionToken({
      role: "participant",
      identifier: student.registrationNumber,
    }),
  );

  redirect("/?message=welcome#participant-panel");
}

export async function loginJudge(formData: FormData) {
  const username = readField(formData, "username");
  const accessCode = readField(formData, "accessCode");
  const judge = authenticateJudge(username, accessCode);

  if (!judge) {
    redirect("/judge?error=invalid-judge-login#judge-login");
  }

  await storeSessionCookie(
    createSessionToken({
      role: "judge",
      identifier: judge.username,
    }),
  );

  redirect("/judge?message=welcome-judge#judge-panel");
}

export async function logoutSession() {
  const cookieStore = await cookies();
  cookieStore.delete("ems_session");
  redirect("/?message=signed-out");
}

export async function applyToEvent(formData: FormData) {
  const cookieStore = await cookies();
  const registrationNumber = readSessionRegistrationNumber(
    cookieStore.get("ems_session")?.value,
  );
  const eventId = Number(readField(formData, "eventId"));
  const teamName = readField(formData, "teamName");
  const teamMembers = parseTeamMembers(readField(formData, "teamMembers"));

  if (!registrationNumber || Number.isNaN(eventId)) {
    redirect("/?error=participant-access-required#participant-login");
  }

  try {
    const status = createApplicationForStudent(
      registrationNumber,
      eventId,
      teamName || null,
      teamMembers,
    );
    revalidatePath("/");
    revalidatePath("/judge");
    redirect(`/?message=${status === "waitlisted" ? "waitlisted" : "applied"}#events`);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "registration-failed";
    redirect(`/?error=${reason}#events`);
  }
}

export async function enterSubEvent(formData: FormData) {
  const cookieStore = await cookies();
  const registrationNumber = readSessionRegistrationNumber(
    cookieStore.get("ems_session")?.value,
  );
  const subEventId = Number(readField(formData, "subEventId"));

  if (!registrationNumber || Number.isNaN(subEventId)) {
    redirect("/?error=participant-access-required#participant-login");
  }

  try {
    enterParticipantTeamIntoSubEvent(registrationNumber, subEventId);
    revalidatePath("/");
    revalidatePath("/judge");
    redirect("/?message=sub-event-entered#sub-events");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "sub-event-failed";
    redirect(`/?error=${reason}#sub-events`);
  }
}

export async function submitJudgeScore(formData: FormData) {
  const cookieStore = await cookies();
  const judgeUsername = readSessionJudgeUsername(
    cookieStore.get("ems_session")?.value,
  );
  const applicationId = Number(readField(formData, "applicationId"));
  const roundName = readField(formData, "roundName");

  if (!judgeUsername || Number.isNaN(applicationId)) {
    redirect("/judge?error=judge-access-required#judge-login");
  }

  try {
    submitJudgeScoreDraft(judgeUsername, {
      applicationId,
      roundName,
      metricValues: [
        Number(readField(formData, "metric1")),
        Number(readField(formData, "metric2")),
        Number(readField(formData, "metric3")),
        Number(readField(formData, "metric4")),
        Number(readField(formData, "metric5")),
      ],
      adminNotes: readField(formData, "adminNotes"),
    });
    revalidatePath("/");
    revalidatePath("/judge");
    revalidatePath("/admin");
    redirect("/judge?message=score-submitted#scoring-queue");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "score-submit-failed";
    redirect(`/judge?error=${reason}#scoring-queue`);
  }
}

export async function createEventAction(formData: FormData) {
  try {
    createEvent({
      name: readField(formData, "name"),
      description: readField(formData, "description"),
      eventType: readField(formData, "eventType") === "team" ? "team" : "individual",
      teamSize: Number(readField(formData, "teamSize")) || 1,
      maxParticipants: Number(readField(formData, "maxParticipants")) || 1,
      startAt: readField(formData, "startAt"),
      endAt: readField(formData, "endAt"),
      ruleSummary: readField(formData, "ruleSummary"),
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/judge");
    redirect("/admin?message=event-created#event-config");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid-event";
    redirect(`/admin?error=${reason}#event-config`);
  }
}

export async function validateScoreDraft(formData: FormData) {
  const draftId = Number(readField(formData, "draftId"));

  if (Number.isNaN(draftId)) {
    redirect("/admin?error=invalid-draft#score-queue");
  }

  validateScoreDraftById(draftId);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/judge");
  redirect("/admin?message=score-validated#score-queue");
}

export async function lockScoreDraft(formData: FormData) {
  const draftId = Number(readField(formData, "draftId"));

  if (Number.isNaN(draftId)) {
    redirect("/admin?error=invalid-draft#score-queue");
  }

  lockScoreDraftById(draftId);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/judge");
  redirect("/admin?message=score-locked#score-queue");
}
