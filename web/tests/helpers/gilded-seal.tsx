import GildedSealRoot from "@/components/templates/gilded-seal/GildedSeal";
import type { TemplateProps } from "@/components/templates/types";
import { KitRoot } from "@/lib/kit/KitRoot";

/** The template as TemplateHost mounts it: inside KitRoot (theme variables, fonts, motion policy). */
export default function GildedSeal(p: TemplateProps) {
  return (
    <KitRoot slug="gilded-seal" mode={p.mode} theme={p.invite?.theme}>
      <GildedSealRoot {...p} />
    </KitRoot>
  );
}
