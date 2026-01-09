/**
 * DocumentGrid - Homepage view showing all documents
 * 
 * Displays documents in either grid or list view with:
 * - Search functionality
 * - Create new document button
 * - Theme toggle
 * - Manual refresh
 * 
 * Documents are sorted by modification date (most recent first).
 */

import React from 'react';
import { Plus, Search, Grid3x3, List, FileText, Sun, Moon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DocumentCard from './DocumentCard';
import { Note } from '../notes/types';
import { useTheme } from 'next-themes';

interface DocumentGridProps {
  documents: Note[];
  onCreateNew: () => void;
  onSelectDocument: (doc: Note) => void;
  onDeleteDocument: (doc: Note) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onCreateNew,
  onSelectDocument,
  onDeleteDocument,
  searchQuery,
  onSearchChange,
  isLoading,
  isRefreshing,
  onRefresh
}) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const {
    theme,
    setTheme
  } = useTheme();

  // Sort documents: notes with timestamps first (most recent), then legacy notes without timestamps
  const sortedDocuments = [...documents].sort((a, b) => {
    const aHasTime = a.timestamp > 0;
    const bHasTime = b.timestamp > 0;
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;
    if (aHasTime && bHasTime) return b.timestamp - a.timestamp;
    // Both without timestamps - sort alphabetically by title
    return a.data.title.localeCompare(b.data.title);
  });

  // Filter documents based on search
  const filteredDocs = sortedDocuments.filter(doc => doc.data.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.data.contents.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="min-h-screen bg-background overflow-y-auto">
    {/* Header */}
    <header className="border-b bg-card sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Metanet Docs</h1>
          <div className="flex items-center gap-1 md:gap-2">
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh notes" className="h-9 w-9 md:h-10 md:w-10">
                <RefreshCw className={`h-4 w-4 md:h-5 md:w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme" className="h-9 w-9 md:h-10 md:w-10">
              {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={`h-9 w-9 md:h-10 md:w-10 ${viewMode === 'grid' ? 'bg-accent' : ''}`}>
              <Grid3x3 className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={`h-9 w-9 md:h-10 md:w-10 ${viewMode === 'list' ? 'bg-accent' : ''}`}>
              <List className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>

    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
      {/* Search Bar */}
      <div className="mb-6 md:mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 md:pl-10 h-10 md:h-12 text-sm md:text-base touch-manipulation"
          />
        </div>
      </div>

      {/* Start a New Document Section */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xs md:text-sm font-medium text-muted-foreground mb-3 md:mb-4">Start a new document</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          <button
            onClick={onCreateNew}
            className="group flex flex-col items-center justify-center aspect-[3/4] rounded-lg border-2 border-border hover:border-primary active:scale-95 transition-all bg-card touch-manipulation"
          >
            <div className="w-full h-full flex flex-col items-center justify-center p-3 md:p-4">
              <Plus className="h-10 md:h-12 w-10 md:w-12 text-primary mb-1 md:mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs md:text-sm font-medium text-foreground">Blank</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <h2 className="text-xs md:text-sm font-medium text-muted-foreground mb-3 md:mb-4">
          {searchQuery ? 'Search Results' : 'Recent documents'}
        </h2>

        {isLoading ? <div className="flex items-center justify-center py-8 md:py-12">
          <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-b-2 border-primary"></div>
        </div> : filteredDocs.length === 0 ? <div className="text-center py-8 md:py-12">
          <FileText className="h-10 md:h-12 w-10 md:w-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
          <p className="text-sm md:text-base text-muted-foreground">
            {searchQuery ? 'No documents found' : 'No documents yet'}
          </p>
        </div> : <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4' : 'space-y-2'}>
          {filteredDocs.map(doc => <DocumentCard key={doc.tokenId} document={doc} onSelect={onSelectDocument} onDelete={onDeleteDocument} viewMode={viewMode} />)}
        </div>}
      </div>
    </div>
  </div>;
};
export default DocumentGrid;