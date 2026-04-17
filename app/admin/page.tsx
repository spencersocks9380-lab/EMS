import { AdminScreen } from "@/app/components/admin-screen";
import { getAdminDashboard } from "@/lib/db";

export const runtime = "nodejs";

type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: AdminSearchParams;
}) {
  const params = (searchParams && (await searchParams)) ?? {};
  const data = getAdminDashboard();

  return (
    <AdminScreen
      data={data}
      error={readParam(params, "error")}
      message={readParam(params, "message")}
    />
  );
}
