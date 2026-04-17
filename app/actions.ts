"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, readSessionRegistrationNumber } from "@/lib/auth";
import {
  authenticateStudent,
  createApplicationForStudent,
  createEvent,
  lockScoreDraftById,
  validateScoreDraftById,
} from "@/lib/db";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginStudent(formData: FormData) {
  const registrationNumber = readField(formData, "registrationNumber");
  const phoneNumber = readField(formData, "phoneNumber");
  const student = authenticateStudent(registrationNumber, phoneNumber);

  if (!student) {
    redirect("/?error=invalid-login#login");
  }

  const cookieStore = await cookies();
  cookieStore.set("ems_session", createSessionToken(student.registrationNumber), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/?message=welcome#portal");
}

export async function logoutStudent() {
  const cookieStore = await cookies();
  cookieStore.delete("ems_session");
  redirect("/?message=signed-out");
}

export async function applyToEvent(formData: FormData) {
  const cookieStore = await cookies();
  const session = cookieStore.get("ems_session")?.value;
  const registrationNumber = readSessionRegistrationNumber(session);
  const eventId = Number(readField(formData, "eventId"));
  const teamName = readField(formData, "teamName");

  if (!registrationNumber || Number.isNaN(eventId)) {
    redirect("/?error=login-required#login");
  }

  try {
    const status = createApplicationForStudent(
      registrationNumber,
      eventId,
      teamName || null,
    );
    revalidatePath("/");
    redirect(`/?message=${status === "waitlisted" ? "waitlisted" : "applied"}#events`);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "registration-failed";
    redirect(`/?error=${reason}#events`);
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
  redirect("/admin?message=score-locked#score-queue");
}
