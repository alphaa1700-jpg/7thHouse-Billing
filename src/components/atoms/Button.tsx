import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";
type V = "brew"|"brew-sm"|"brew-full"|"tab"|"tab-active"|"qty";
interface P extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: V; }
export function Button({ variant="tab", className, children, ...props }: P) {
  return (
    <button
      className={clsx(
        variant==="brew"       && "btn-brew",
        variant==="brew-sm"    && "btn-brew btn-brew--sm",
        variant==="brew-full"  && "btn-brew btn-brew--full",
        variant==="tab"        && "btn-tab",
        variant==="tab-active" && "btn-tab btn-tab--active",
        variant==="qty"        && "btn-qty",
        className
      )}
      {...props}
    >{children}</button>
  );
}
