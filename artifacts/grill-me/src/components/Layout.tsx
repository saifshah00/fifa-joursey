import React from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Menu, X, Shirt } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';

export function Layout({ children }: { children: React.ReactNode }) {
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent selection:text-primary">
      {/* Promo Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-medium font-display tracking-wide uppercase">
        Free worldwide shipping on all orders over $100
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Shirt className="h-6 w-6 text-primary group-hover:text-accent transition-colors" />
              <span className="font-display font-black text-2xl tracking-tighter uppercase">Saifit</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium uppercase tracking-wider font-display">
              <Link href="/shop" className="hover:text-accent transition-colors">All Jerseys</Link>
              <Link href="/shop?type=home" className="hover:text-accent transition-colors">Home</Link>
              <Link href="/shop?type=away" className="hover:text-accent transition-colors">Away</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-accent hover:text-primary rounded-full transition-colors">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4 shadow-lg">
            <nav className="flex flex-col space-y-4 text-lg font-display font-bold uppercase tracking-wider">
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>All Jerseys</Link>
              <Link href="/shop?type=home" onClick={() => setMobileMenuOpen(false)}>Home Kits</Link>
              <Link href="/shop?type=away" onClick={() => setMobileMenuOpen(false)}>Away Kits</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shirt className="h-6 w-6 text-accent" />
              <span className="font-display font-black text-2xl tracking-tighter uppercase text-white">Saifit</span>
            </div>
            <p className="text-primary-foreground/60 max-w-xs font-sans">
              Premium football kits for the true fans. Wear your colors with pride.
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold uppercase tracking-wider mb-4 text-white">Shop</h4>
            <ul className="space-y-2 text-primary-foreground/70 font-sans">
              <li><Link href="/shop">New Arrivals</Link></li>
              <li><Link href="/shop">National Teams</Link></li>
              <li><Link href="/shop">Clubs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold uppercase tracking-wider mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-primary-foreground/70 font-sans">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping & Returns</a></li>
              <li><a href="#">Size Guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold uppercase tracking-wider mb-4 text-white">Newsletter</h4>
            <p className="text-primary-foreground/60 font-sans mb-4">
              Get the latest drops and exclusive offers.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-primary-foreground/10 border border-primary-foreground/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent w-full"
              />
              <Button className="bg-accent text-primary hover:bg-accent/90 rounded font-bold uppercase tracking-wide">
                Join
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-16 pt-8 border-t border-primary-foreground/10 text-center text-primary-foreground/50 text-sm font-sans">
          &copy; {new Date().getFullYear()} Saifit. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
