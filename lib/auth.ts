import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionRole = "participant" | "judge";

type SessionIdentity = {
  role: SessionRole;
  identifier: string;
};

const SESSION_SECRET =
  process.env.EMS_SESSION_SECRET ?? "ems-local-session-secret-change-me";

function createSignature(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionToken(identity: SessionIdentity) {
  const payload = `${identity.role}:${identity.identifier}`;
  return `${payload}.${createSignature(payload)}`;
}

export function readSessionIdentity(token: string | undefined) {
  if (!token) {
    return null;
  }

  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const [role, identifier] = payload.split(":");

  if (
    !identifier ||
    (role !== "participant" && role !== "judge")
  ) {
    return null;
  }

  const expected = createSignature(payload);

  if (signature.length !== expected.length) {
    return null;
  }

  const isValid = timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8"),
  );

  return isValid ? { role, identifier } : null;
}

export function readSessionRegistrationNumber(token: string | undefined) {
  const identity = readSessionIdentity(token);
  return identity?.role === "participant" ? identity.identifier : null;
}

export function readSessionJudgeUsername(token: string | undefined) {
  const identity = readSessionIdentity(token);
  return identity?.role === "judge" ? identity.identifier : null;
}
