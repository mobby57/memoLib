import { redirect } from 'next/navigation';

export default function SettingsBillingRedirect({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { upgrade?: string };
}) {
  const qs = searchParams.upgrade ? `?upgrade=${searchParams.upgrade}` : '';
  redirect(`/${params.locale}/billing${qs}`);
}
