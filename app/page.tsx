import { cookies } from "next/headers";
import { HomeScreen } from "@/app/components/home-screen";
import { readSessionRegistrationNumber } from "@/lib/auth";
import { getHomeData } from "@/lib/db";

export const runtime = "nodejs";

type HomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: HomeSearchParams;
}) {
  const params = (searchParams && (await searchParams)) ?? {};
  const cookieStore = await cookies();
  const registrationNumber = readSessionRegistrationNumber(
    cookieStore.get("ems_session")?.value,
  );
  const data = getHomeData(registrationNumber);

  return (
    <HomeScreen
      data={data}
      error={readParam(params, "error")}
      message={readParam(params, "message")}
    />
  );
}
