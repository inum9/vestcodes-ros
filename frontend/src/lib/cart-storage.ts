export type CartLine = {
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
  };
  
  const cartKey = (tableId: number) => `ros_cart_${tableId}`;
  
  export function loadCart(tableId: number): CartLine[] {
    const raw = localStorage.getItem(cartKey(tableId));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartLine[];
    } catch {
      return [];
    }
  }
  
  export function saveCart(tableId: number, items: CartLine[]) {
    localStorage.setItem(cartKey(tableId), JSON.stringify(items));
  }
  
  export function clearCart(tableId: number) {
    localStorage.removeItem(cartKey(tableId));
  }
  
  export function cartCount(items: CartLine[]) {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
  
  export function cartSubtotal(items: CartLine[]) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }