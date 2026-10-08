import styles from "./Chip.module.css";

type Props = {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

// Button when interactive (onClick), otherwise a static span.
export function Chip({ active = false, onClick, className = "", children }: Props) {
  const cls = [styles.chip, active ? styles.on : "", className].filter(Boolean).join(" ");
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-pressed={active}>
        {children}
      </button>
    );
  }
  return <span className={cls}>{children}</span>;
}

export default Chip;
