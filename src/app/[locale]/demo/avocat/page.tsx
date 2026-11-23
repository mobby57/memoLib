import { redirect } from 'next/navigation';

export default async function LegacyLawyerDemo({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/demo/complete`);
}
