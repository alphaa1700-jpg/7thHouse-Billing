import { Notification } from "@/types";
import { Icon } from "@/components/atoms/Icon";
import clsx from "clsx";
interface P { notif: Notification; onDismiss: (id:string)=>void; }
export function NotificationToast({ notif, onDismiss }: P) {
  return (
    <div className={clsx("notif-toast", notif.leaving && "notif-toast--leaving")}>
      <div className="notif-toast__inner">
        <Icon name="ti-bell" className="notif-toast__icon" />
        <span className="notif-toast__msg">{notif.message}</span>
        <button className="notif-toast__close" onClick={()=>onDismiss(notif.id)}>×</button>
      </div>
    </div>
  );
}
