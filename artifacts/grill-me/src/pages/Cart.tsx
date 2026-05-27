import React from 'react';
import { Link } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background px-4">
        <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black font-display uppercase tracking-wider mb-4 text-center">Your Cart is Empty</h1>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Looks like you haven't added any kits to your cart yet. Gear up for the next match.
        </p>
        <Link href="/shop">
          <Button size="lg" className="font-bold uppercase tracking-widest h-14 px-8 bg-primary">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tighter mb-10">
          Your Cart
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3 space-y-6">
            {cart.map((item) => (
              <div 
                key={`${item.jerseyId}-${item.size}`} 
                className="flex gap-4 md:gap-6 bg-card border rounded-xl p-4 md:p-6 shadow-sm"
              >
                <div className="w-24 md:w-32 aspect-[3/4] bg-muted rounded-lg overflow-hidden shrink-0">
                  <img 
                    src={item.imageUrl} 
                    alt={item.jerseyName} 
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-display mb-1">
                        {item.teamName}
                      </p>
                      <h3 className="font-bold text-lg md:text-xl leading-tight mb-2">
                        {item.jerseyName}
                      </h3>
                      <p className="text-sm bg-muted inline-flex px-2 py-1 rounded font-medium">
                        Size: <span className="font-bold ml-1">{item.size}</span>
                      </p>
                    </div>
                    <p className="font-display font-black text-lg md:text-xl text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-sm hover:bg-background"
                        onClick={() => updateQuantity(item.jerseyId, item.size, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold font-display">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-sm hover:bg-background"
                        onClick={() => updateQuantity(item.jerseyId, item.size, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.jerseyId, item.size)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline font-bold uppercase text-xs">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8 sticky top-24">
              <h2 className="text-2xl font-black font-display uppercase tracking-wider mb-6">
                Summary
              </h2>
              
              <div className="space-y-4 mb-6 text-primary-foreground/80 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="text-white">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-primary-foreground/20 mb-8 flex justify-between items-end">
                <span className="text-lg font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl font-black font-display tracking-tighter">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              
              <Link href="/checkout">
                <Button className="w-full h-16 text-lg font-bold uppercase tracking-widest bg-accent text-primary hover:bg-accent/90 group">
                  Checkout
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
