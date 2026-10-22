function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// Shows the photo when there is one, otherwise the person's initials.
export default function Avatar({ name, src, className = "" }) {
  const base = "size-9 shrink-0 rounded-full";
  if (src) {
    return <img src={src} alt="" className={`${base} object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${base} grid place-items-center bg-primary-soft text-sm font-medium text-primary ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
