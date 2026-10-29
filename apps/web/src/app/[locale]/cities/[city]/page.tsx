import { LandingView } from '@/components/seo/LandingView';
import { landingMetadata, resolveLanding, type LandingSearch } from '@/lib/seo/landingRoute';

type Props = { params: Promise<{ locale: string; city: string }>; searchParams: Promise<LandingSearch> };

export async function generateMetadata({ params, searchParams }: Props) {
  return landingMetadata(await params, await searchParams);
}

export default async function CityPage({ params, searchParams }: Props) {
  return <LandingView r={resolveLanding(await params)} search={await searchParams} />;
}
