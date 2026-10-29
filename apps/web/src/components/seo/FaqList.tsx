// Questions and answers as plain headings and paragraphs: all of it is in the initial HTML
// (no accordion), so crawlers and assistants can read and quote it.
export function FaqList({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">{title}</h2>
      {items.map((f) => (
        <div key={f.q} className="faq__item">
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </section>
  );
}
