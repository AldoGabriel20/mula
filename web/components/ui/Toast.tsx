import styles from "./Toast.module.css";

type Kind = "ok" | "warn" | "error" | "info";

type Props = {
  kind?: Kind;
  message: string;
  className?: string;
  inline?: boolean; // render in-flow (e.g. showcase) instead of fixed overlay
};

// Presentational toast (dot color = kind). Timing/queue belongs to a toast host
// mounted higher up; this renders one notice.
export function Toast({ kind = "ok", message, className = "", inline = false }: Props) {
  return (
    <div
      className={[styles.toast, inline ? styles.inline : "", className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <i className={[styles.dot, styles[kind]].join(" ")} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default Toast;
