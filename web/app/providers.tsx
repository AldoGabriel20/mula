"use client";

import { createContext, useContext } from "react";
import { ThemeProvider } from "@/lib/theme";
import { MotionProvider } from "@/lib/motion";

/* Root providers are shipped on EVERY route (marketing, auth, public invite, dashboard), so they
 * stay minimal: theme + motion capabilities + locale. Data fetching (React Query) is scoped to the
 * dashboard layout so static pages don't pay for it. LocaleProvider is a stub until next-intl. */
const LocaleContext = createContext<string>("en");
export const useLocale = () => useContext(LocaleContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionProvider>
        <LocaleContext.Provider value="en">{children}</LocaleContext.Provider>
      </MotionProvider>
    </ThemeProvider>
  );
}
