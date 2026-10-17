import { CATEGORY_GLYPH, type Category } from '@/components/map/categoryIcons';

// Same glyphs as the map markers (categoryIcons.ts). The markup is a static trusted constant.
export function CategoryIcon({ category, size = 20 }: { category: Category; size?: number }) {
  return (
    <svg
      className="lucide"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: CATEGORY_GLYPH[category] }}
    />
  );
}
