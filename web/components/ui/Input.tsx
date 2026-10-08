import { forwardRef, useId } from "react";
import styles from "./Field.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, className = "", ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errId = error ? `${fieldId}-err` : undefined;

  return (
    <div className={styles.field}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <input
        ref={ref}
        id={fieldId}
        className={[styles.inp, error ? styles.error : "", className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        {...rest}
      />
      {error && (
        <span id={errId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
