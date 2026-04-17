import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_SECRET =
  process.env.EMS_SESSION_SECRET ?? "ems-local-session-secret-change-me";

function createSignature(registrationNumber: string) {
  return createHmac("sha256", SESSION_SECRET)
    .update(registrationNumber)
    .digest("hex");
}

export function createSessionToken(registrationNumber: string) {
  return `${registrationNumber}.${createSignature(registrationNumber)}`;
}

export function readSessionRegistrationNumber(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [registrationNumber, signature] = token.split(".");

  if (!registrationNumber || !signature) {
    return null;
  }

  const expected = createSignature(registrationNumber);

  if (signature.length !== expected.length) {
    return null;
  }

  const isValid = timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8"),
  );

  return isValid ? registrationNumber : null;
}
