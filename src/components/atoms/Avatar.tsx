import clsx from "clsx";
interface P { initials: string; color?: string; size?: "sm"|"md"; imageUrl?: string; }
export function Avatar({ initials, color="#C8761A", size="md", imageUrl }: P) {
  return (
    <div className={clsx("avatar", size==="sm" ? "avatar--sm" : "avatar--md")} style={{ background: color, overflow: "hidden", padding: 0 }}>
      {imageUrl
        ? <img src={imageUrl} alt={initials} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        : initials
      }
    </div>
  );
}