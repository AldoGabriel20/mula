/** Copy text: the async clipboard API in secure contexts, a hidden textarea + execCommand elsewhere. */
export async function copyText(text: string): Promise<boolean> {
  const fallback = () => {
    try {
      const t = document.createElement("textarea");
      t.value = text;
      t.setAttribute("readonly", "");
      t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch {
      return false;
    }
  };
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallback();
    }
  }
  return fallback();
}
