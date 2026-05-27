import React from 'react';
import { Link } from 'wouter';
import { useGetFeaturedJerseys } from '@workspace/api-client-react';
import { JerseyCard } from '@/components/JerseyCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Trophy, Shield, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-stadium.png';

export default function Home() {
  const { data: featuredJerseys, isLoading } = useGetFeaturedJerseys();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full bg-primary flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Stadium Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
        </div>
        
        <div className="container relative z-10 px-4 mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-black font-display text-white uppercase tracking-tighter leading-none mb-6">
              Defend<br/>
              <span className="text-accent">Your Colors.</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 font-sans mb-10 max-w-xl">
              The world's premium destination for authentic national team kits. Wear the passion.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop">
                <Button size="lg" className="bg-accent text-primary hover:bg-accent/90 font-bold uppercase tracking-widest text-lg h-14 px-8 group">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tighter text-foreground">
                Starting XI
              </h2>
              <p className="text-muted-foreground mt-2 font-medium">Most wanted kits right now</p>
            </div>
            <Link href="/shop" className="hidden md:flex items-center text-primary font-bold uppercase tracking-wider hover:text-accent transition-colors">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-6 bg-muted animate-pulse rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredJerseys?.slice(0, 4).map(jersey => (
                <JerseyCard key={jersey.id} jersey={jersey} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/shop">
              <Button variant="outline" className="w-full border-2 font-bold uppercase tracking-wider">
                View All Kits
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-muted">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-primary text-accent rounded-full flex items-center justify-center mb-2">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-2xl uppercase tracking-wider">Authentic Quality</h3>
              <p className="text-muted-foreground max-w-sm">Premium materials crafted to the exact specifications worn by the pros.</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-primary text-accent rounded-full flex items-center justify-center mb-2">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-2xl uppercase tracking-wider">Secure Checkout</h3>
              <p className="text-muted-foreground max-w-sm">Your payment information is encrypted and protected. Shop with confidence.</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 bg-primary text-accent rounded-full flex items-center justify-center mb-2">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="font-display font-bold text-2xl uppercase tracking-wider">Express Delivery</h3>
              <p className="text-muted-foreground max-w-sm">Fast worldwide shipping. Get your kit before the next big match.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
