import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useGetJersey } from '@workspace/api-client-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, ShieldCheck, Truck, Star } from 'lucide-react';
import { Link } from 'wouter';

export default function JerseyDetail() {
  const [, params] = useRoute('/jersey/:id');
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: jersey, isLoading } = useGetJersey(id);
  
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 animate-pulse">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 aspect-[3/4] bg-muted rounded-xl" />
          <div className="w-full md:w-1/2 space-y-6 py-8">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-12 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!jersey) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black font-display uppercase tracking-wider mb-4">Jersey not found</h1>
        <Link href="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Select a size",
        description: "Please select a size before adding to cart.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    
    // Simulate slight delay for premium feel
    setTimeout(() => {
      addToCart({
        jerseyId: jersey.id,
        jerseyName: jersey.name,
        teamName: jersey.team,
        imageUrl: jersey.imageUrl,
        price: jersey.price,
        size: selectedSize,
        quantity: 1
      });
      
      setIsAdding(false);
      
      toast({
        title: "Added to cart",
        description: `${jersey.name} (${selectedSize}) has been added to your cart.`,
        className: "bg-primary text-primary-foreground border-none",
      });
    }, 400);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link href="/shop" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Collection
        </Link>

        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          {/* Image Gallery */}
          <div className="w-full md:w-1/2">
            <div className="bg-muted rounded-2xl overflow-hidden relative aspect-[3/4]">
              <img 
                src={jersey.imageUrl} 
                alt={jersey.name} 
                className="w-full h-full object-cover mix-blend-multiply"
              />
              {jersey.isFeatured && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 flex flex-col justify-center py-6">
            <div className="mb-2">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-display">
                {jersey.team} • {jersey.type} Kit
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display uppercase tracking-tighter leading-none mb-6">
              {jersey.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${star <= (jersey.rating || 5) ? 'fill-primary text-primary' : 'fill-muted text-muted'}`} 
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                ({jersey.reviewCount || 0} Reviews)
              </span>
            </div>
            
            <div className="flex items-end gap-4 mb-10 pb-10 border-b">
              <span className="text-4xl font-display font-black">
                ${jersey.price.toFixed(2)}
              </span>
              {jersey.originalPrice && (
                <span className="text-xl text-muted-foreground line-through font-display font-bold mb-1">
                  ${jersey.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Size Selector */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold uppercase tracking-wider text-sm">Select Size</h3>
                <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Size Guide
                </button>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {jersey.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`
                      h-12 flex items-center justify-center border-2 font-display font-bold text-lg rounded-md transition-all
                      ${selectedSize === size 
                        ? 'border-primary bg-primary text-primary-foreground scale-105 shadow-md' 
                        : 'border-border hover:border-primary/50 text-foreground'}
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-4">
              <Button 
                size="lg" 
                className={`w-full h-16 text-lg font-bold uppercase tracking-widest ${isAdding ? 'bg-green-600 hover:bg-green-700' : 'bg-accent text-primary hover:bg-accent/90'}`}
                disabled={!jersey.inStock || isAdding}
                onClick={handleAddToCart}
              >
                {isAdding ? (
                  <>
                    <Check className="mr-2 h-6 w-6" /> Added
                  </>
                ) : !jersey.inStock ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-8 py-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Free Shipping
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Authentic Guarantee
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
