type Props = {
  active?: boolean;
  size?: number;
  className?: string;
};

// Brand dot marker (the taupe dot = "you, here, now"). Active = accent; idle = muted.
export function Dot({ active = false, size = 8, className }: Props) {
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: active ? "var(--dot)" : "var(--line2)",
        transition: "background .25s",
      }}
    />
  );
}

export default Dot;
