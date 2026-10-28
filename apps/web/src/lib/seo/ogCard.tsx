import { ImageResponse } from 'next/og';

// next/og renders without the CSS tokens, so the brand palette is repeated here (tokens.css:
// --forest, --accent-700, --bg, ink). Keep in sync when the palette changes.
const GREEN = '#205A28';
const RED = '#C72B32';
const INK = '#14301A';
const WHITE = '#FFFFFF';

export const OG_SIZE = { width: 1200, height: 630 };

type Card = { heading: string; sub?: string; price?: string; photo?: string };

const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

// 1200x630 brand card: white surface, green footer band with the wordmark, red only for the price.
export function ogCard({ heading, sub, price, photo }: Card) {
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: WHITE }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              padding: '0 64px',
              color: INK,
            }}
          >
            <div style={{ fontSize: photo ? 62 : 80, fontWeight: 700, lineHeight: 1.1 }}>{heading}</div>
            {sub && <div style={{ fontSize: 34, marginTop: 24, color: GREEN }}>{sub}</div>}
            {price && <div style={{ fontSize: 44, marginTop: 28, fontWeight: 700, color: RED }}>{price}</div>}
          </div>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img>
            <img src={photo} alt="" width={520} height={534} style={{ objectFit: 'cover' }} />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 96,
            padding: '0 64px',
            background: GREEN,
            color: WHITE,
            fontSize: 44,
            fontWeight: 700,
          }}
        >
          GearQuest
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: { 'Cache-Control': CACHE } },
  );
}
