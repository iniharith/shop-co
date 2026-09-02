import { redirect } from "next/navigation";

export default async function LegacyTaskAccessRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`https://kampungcetak.com/task-access/${encodeURIComponent(token)}`);
}
