import { useTranslations } from 'next-intl';
import { FindIcon, HandshakeIcon, SendIcon } from '@/components/ui/icons';

// Calm three-step strip: Find, Request, Meet.
export function HowItWorks() {
  const t = useTranslations('home.how');
  const steps = [
    { key: 'find', icon: <FindIcon size={26} /> },
    { key: 'request', icon: <SendIcon size={26} /> },
    { key: 'meet', icon: <HandshakeIcon size={26} /> },
  ] as const;
  return (
    <section className="how" aria-labelledby="how-title">
      <h2 id="how-title">{t('title')}</h2>
      <ol className="how__list">
        {steps.map((s, i) => (
          <li key={s.key} className="how__step">
            <span className="how__icon">{s.icon}</span>
            <span className="how__n num" aria-hidden="true">
              {i + 1}
            </span>
            <h3>{t(`${s.key}.title`)}</h3>
            <p>{t(`${s.key}.text`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
