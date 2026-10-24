// The botanical sprig used as blurred foreground foliage (cover, hero, venue, closing). One stem,
// up to seven leaves, optional gold berries. Coordinates are the prototype's.

const LEAVES = [
  "translate(98 272) rotate(200) scale(1.15)",
  "translate(102 240) rotate(-28) scale(1.1)",
  "translate(106 200) rotate(208)",
  "translate(105 166) rotate(-32) scale(.95)",
  "translate(100 128) rotate(212) scale(.9)",
  "translate(97 94) rotate(-38) scale(.8)",
  "translate(99 60) rotate(218) scale(.7)",
];
const BERRIES: [number, number, number][] = [
  [113, 4, 3],
  [120, 13, 2.3],
  [107, 12, 2],
];
const LEAF = "M0 0C10-9 28-10 42 0C28 10 10 9 0 0Z";

type Props = {
  /** CSS transform of the svg (rotation / mirroring). */
  transform: string;
  leaves?: number;
  /** Leaf fill alpha (the sage colour is rgba(143,146,116,a)). */
  fillAlpha?: number;
  stem?: string;
  stemWidth?: number;
  leafStrokeWidth?: number;
  /** Which berries to draw, by index (0..2). */
  berries?: number[];
  /** Muted palette used on the closing page. */
  muted?: boolean;
};

export function Sprig({ transform, leaves = 7, fillAlpha = 0.55, stemWidth = 2, leafStrokeWidth = 1, berries = [], muted = false }: Props) {
  const stroke = muted ? "#8F9274" : "#7F8466";
  const fill = muted ? `rgba(163,165,140,${fillAlpha})` : `rgba(143,146,116,${fillAlpha})`;
  return (
    <svg viewBox="0 0 200 320" fill="none" aria-hidden="true" style={{ width: "100%", height: "auto", display: "block", overflow: "visible", transform }}>
      <path d="M100 318C95 252 112 196 99 128C90 80 96 38 112 2" stroke={stroke} strokeWidth={stemWidth} strokeLinecap="round" />
      <g fill={fill} stroke={stroke} strokeWidth={leafStrokeWidth}>
        {LEAVES.slice(0, leaves).map((tf) => (
          <g key={tf} transform={tf}>
            <path d={LEAF} />
          </g>
        ))}
      </g>
      {berries.length > 0 && (
        <g fill="#C7A66A">
          {berries.map((i) => (
            <circle key={i} cx={BERRIES[i][0]} cy={BERRIES[i][1]} r={BERRIES[i][2]} />
          ))}
        </g>
      )}
    </svg>
  );
}
