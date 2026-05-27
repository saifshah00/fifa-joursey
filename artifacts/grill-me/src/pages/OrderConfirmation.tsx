import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';

export default function OrderConfirmation() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background px-4 py-20">
      <div className="max-w-md w-full text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-50 animate-pulse" />
          <CheckCircle2 className="h-24 w-24 text-primary relative z-10" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tighter mb-4">
          Order Confirmed
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8">
          Your kit is secured. We've sent a confirmation email with your order details and tracking information.
        </p>
        
        <div className="bg-card border rounded-2xl p-6 mb-10 text-left">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Package className="h-6 w-6" />
            <h3 className="font-bold uppercase tracking-wider">What's Next?</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our team is preparing your order for shipment. You will receive another notification when your package leaves our warehouse.
          </p>
        </div>
        
        <Link href="/shop">
          <Button size="lg" className="w-full h-14 text-lg font-bold uppercase tracking-widest bg-primary group">
            Continue Shopping
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
