import type { MetadataRoute } from 'next';
import { buildRobots } from '@/lib/seo/robotsRules';

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
