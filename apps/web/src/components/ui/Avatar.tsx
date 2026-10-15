export function Avatar({ name, url, size = 32 }: { name: string; url?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size / 2 };
  return url ? (
    // Avatar URLs come from Google, so next/image remote config does not apply.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="avatar" style={style} referrerPolicy="no-referrer" />
  ) : (
    <span className="avatar avatar--initial" style={style} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
