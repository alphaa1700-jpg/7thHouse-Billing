import { CartItem } from "@/types";
import { Button } from "@/components/atoms/Button";
interface P { item: CartItem; index: number; onChangeQty: (i:number,d:number)=>void; }
export function CartItemRow({ item, index, onChangeQty }: P) {
  return (
    <div className="cart-item">
      <div><div className="cart-item__name">{item.name}</div><div className="cart-item__sub">₹{item.price} each</div></div>
      <div className="cart-item__right">
        <Button variant="qty" onClick={() => onChangeQty(index,-1)}>−</Button>
        <span className="cart-item__qty">{item.qty}</span>
        <Button variant="qty" onClick={() => onChangeQty(index,1)}>+</Button>
        <span className="cart-item__total">₹{item.price*item.qty}</span>
      </div>
    </div>
  );
}
