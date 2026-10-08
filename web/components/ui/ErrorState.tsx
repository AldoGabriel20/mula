import { Button } from "./Button";
import styles from "./State.module.css";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message = "Something went wrong.", onRetry }: Props) {
  return (
    <div className={styles.state} role="alert">
      <p className={styles.title}>Something went wrong</p>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="default" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
