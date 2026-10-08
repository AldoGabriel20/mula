import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { ApiError } from "@/lib/api/fetcher";

// Maps an ApiError onto a form: 400 field errors → per-field; otherwise returns a
// root-level message to show. Non-ApiError → generic message.
export function bindApiError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): string {
  if (err instanceof ApiError) {
    if (err.status === 400 && err.fields) {
      for (const [field, message] of Object.entries(err.fields)) {
        setError(field as Path<T>, { type: "server", message });
      }
      return "";
    }
    if (err.status === 401) return "Invalid email or password.";
    if (err.status === 409) return "That email is already registered.";
    if (err.status === 429) return "Too many attempts. Try again shortly.";
    return err.message || "Something went wrong.";
  }
  return "Network error. Please try again.";
}
