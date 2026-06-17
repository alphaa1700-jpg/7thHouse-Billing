import clsx from "clsx";
type V = "green"|"amber"|"red"|"blue"|"gray"|"trend"|"hot";
interface P { variant: V; children: React.ReactNode; className?: string; }
export function Badge({ variant, children, className }: P) {
  return <span className={clsx("badge", `badge--${variant}`, className)}>{children}</span>;
}
