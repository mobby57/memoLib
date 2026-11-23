import { redirect } from 'next/navigation';

export default async function DemoAutoLogin({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/demo/complete`);
}
