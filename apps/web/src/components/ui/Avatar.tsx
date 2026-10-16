import Image from 'next/image';

export function Avatar({ name, url, size = 32 }: { name: string; url?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size / 2 };
  return url ? (
    // Avatar URLs come from Google, so they skip the optimiser (no remote host allow-list).
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      className="avatar"
      unoptimized
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="avatar avatar--initial" style={style} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
