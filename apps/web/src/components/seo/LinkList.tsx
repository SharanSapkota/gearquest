import NextLink from 'next/link';

// Crawlable internal links with descriptive text; used for related categories and cities.
export function LinkList({ title, links }: { title: string; links: { name: string; path: string }[] }) {
  if (links.length === 0) return null;
  return (
    <nav className="linklist" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.path}>
            <NextLink href={l.path}>{l.name}</NextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
