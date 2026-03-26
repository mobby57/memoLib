import { redirect } from 'next/navigation';

type HomePageProps = {
  params: {
    locale: string;
  };
};

export default function LocalizedHomePage({ params }: HomePageProps) {
  redirect(`/${params.locale}/dashboard`);
}
