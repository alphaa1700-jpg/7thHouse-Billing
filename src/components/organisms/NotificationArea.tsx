import { Notification } from "@/types";
import { NotificationToast } from "@/components/molecules/NotificationToast";
interface P { notifications:Notification[]; onDismiss:(id:string)=>void; }
export function NotificationArea({ notifications, onDismiss }: P) {
  return (
    <div className="absolute top-[70px] right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map(n => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast notif={n} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
