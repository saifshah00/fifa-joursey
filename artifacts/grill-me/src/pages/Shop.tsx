import React, { useState } from 'react';
import { useListJerseys } from '@workspace/api-client-react';
import { JerseyCard } from '@/components/JerseyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export default function Shop() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Note: API might not support team search directly, but we can pass it if it does
  // or just use client side filtering if needed. The API spec says team? is supported.
  const { data: jerseys, isLoading } = useListJerseys({ 
    team: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary pt-12 pb-24 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black font-display text-white uppercase tracking-tighter mb-4">
            The Armory
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl font-sans">
            Browse our complete collection of national team kits. Find your colors.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <div className="bg-card rounded-lg shadow-xl border p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search teams..." 
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground shrink-0" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Kit Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kits</SelectItem>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="third">Third</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-6 bg-muted animate-pulse rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : jerseys && jerseys.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {jerseys.map(jersey => (
                <JerseyCard key={jersey.id} jersey={jersey} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-muted/50 rounded-lg border border-dashed mt-8">
              <h3 className="text-2xl font-bold font-display uppercase tracking-wider mb-2">No kits found</h3>
              <p className="text-muted-foreground">We couldn't find any jerseys matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-6 font-bold uppercase"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
