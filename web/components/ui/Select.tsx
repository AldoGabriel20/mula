import { forwardRef, useId } from "react";
import styles from "./Field.module.css";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, id, className = "", children, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errId = error ? `${fieldId}-err` : undefined;

  return (
    <div className={styles.field}>
      {label && <label htmlFor={fieldId}>{label}</label>}
      <select
        ref={ref}
        id={fieldId}
        className={[styles.inp, error ? styles.error : "", className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <span id={errId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

export default Select;
