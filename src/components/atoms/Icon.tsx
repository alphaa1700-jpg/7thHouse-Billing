interface P { name: string; className?: string; }
export function Icon({ name, className }: P) {
  return <i className={`ti ${name}${className ? " "+className : ""}`} aria-hidden="true" />;
}
