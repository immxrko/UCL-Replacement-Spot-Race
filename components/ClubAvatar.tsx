interface ClubAvatarProps {
  name: string;
}

export function ClubAvatar({ name }: ClubAvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-sky-400/70 to-fuchsia-500/70 text-xs font-semibold tracking-wide text-white shadow-lg shadow-sky-500/30">
      {initials}
    </div>
  );
}
