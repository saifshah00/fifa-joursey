import React from 'react';
import { Link } from 'wouter';
import { Jersey } from '@workspace/api-client-react';

interface JerseyCardProps {
  jersey: Jersey;
}

export function JerseyCard({ jersey }: JerseyCardProps) {
  return (
    <Link href={`/jersey/${jersey.id}`} className="group block">
      <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-4 border border-transparent group-hover:border-accent transition-colors duration-300">
        <img 
          src={jersey.imageUrl} 
          alt={jersey.name} 
          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {jersey.isFeatured && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
            Featured
          </div>
        )}
        {!jersey.inStock && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest px-4 py-2 rounded">
              Out of Stock
            </span>
          </div>
        )}
        {jersey.originalPrice && jersey.originalPrice > jersey.price && (
          <div className="absolute top-3 right-3 bg-accent text-primary text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
            Sale
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider font-display">
          {jersey.team}
        </p>
        <h3 className="font-medium text-lg leading-tight group-hover:text-primary transition-colors">
          {jersey.name}
        </h3>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-display font-bold text-lg">
            ${jersey.price.toFixed(2)}
          </span>
          {jersey.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${jersey.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
