import { forwardRef } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "default" | "ghost";
type Size = "default" | "sm" | "icon";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: styles.primary,
  default: "",
  ghost: styles.ghost,
};
const sizeClass: Record<Size, string> = {
  default: "",
  sm: styles.sm,
  icon: styles.icon,
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "default", size = "default", loading = false, disabled, className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[styles.btn, variantClass[variant], sizeClass[size], className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
