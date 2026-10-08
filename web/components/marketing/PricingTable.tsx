import Link from "next/link";
import { Button } from "@/components/ui";
import { PLANS, COMPARE } from "@/lib/marketing/content";
import section from "./section.module.css";
import styles from "./PricingTable.module.css";

export function PricingTable() {
  return (
    <section className={section.section}>
      <div className={section.eyebrow}>
        <span />
        Pricing
      </div>
      <h1 className={section.title}>Simple pricing, per celebration.</h1>
      <p className={section.lede}>Pay once for each event. No subscription and no per-guest fees. Prices shown are placeholders.</p>

      <div className={styles.plans}>
        {PLANS.map((p) => (
          <div key={p.slug} className={`${styles.plan} ${p.featured ? styles.featured : ""}`}>
            {p.featured && <span className={styles.badge}>Most chosen</span>}
            <h2 className={styles.planName}>{p.name}</h2>
            <div className={styles.price}>{p.price}</div>
            <p className={styles.blurb}>{p.blurb}</p>
            <Link href="/register">
              <Button variant={p.featured ? "primary" : "default"}>{p.slug === "custom" ? "Contact us" : "Choose " + p.name}</Button>
            </Link>
          </div>
        ))}
      </div>

      <table className={styles.table}>
        <caption style={{ textAlign: "left", padding: "0 10px 12px", color: "var(--mut)" }}>Compare everything</caption>
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">Essential</th>
            <th scope="col">Signature</th>
            <th scope="col">Custom</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.map((r) => (
            <tr key={r.label}>
              <th scope="row" style={{ fontWeight: 400, color: "var(--ink)" }}>{r.label}</th>
              <td>{r.essential}</td>
              <td>{r.signature}</td>
              <td>{r.custom}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default PricingTable;
