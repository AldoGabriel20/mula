import styles from "./State.module.css";

type Props = {
  title: string;
  message?: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({ title, message, illustration, action }: Props) {
  return (
    <div className={styles.state}>
      {illustration && <div className={styles.illus}>{illustration}</div>}
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.message}>{message}</p>}
      {action}
    </div>
  );
}

export default EmptyState;
