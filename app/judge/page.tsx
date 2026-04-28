import { cookies } from "next/headers";
import { JudgeScreen } from "@/app/components/judge-screen";
import { readSessionJudgeUsername } from "@/lib/auth";
import { getJudgeDashboard } from "@/lib/db";

export const runtime = "nodejs";

type JudgeSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function JudgePage({
  searchParams,
}: {
  searchParams?: JudgeSearchParams;
}) {
  const params = (searchParams && (await searchParams)) ?? {};
  const cookieStore = await cookies();
  const judgeUsername = readSessionJudgeUsername(
    cookieStore.get("ems_session")?.value,
  );
  const data = getJudgeDashboard(judgeUsername);

  return (
    <JudgeScreen
      data={data}
      error={readParam(params, "error")}
      message={readParam(params, "message")}
    />
  );
}
