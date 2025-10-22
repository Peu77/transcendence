import { icons } from "lucide";

export function Icon({ name, size = 24, color = "currentColor" }: {
  name: keyof typeof icons;
  size?: number;
  color?: string;
}) {
  const icon = icons[name];
  if (!icon) return null;

  return {
    type: "svg",
    props: {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      stroke: color,
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      children: icon.map(([tag, attrs]) => ({ type: tag, props: attrs }))
    }
  };
}