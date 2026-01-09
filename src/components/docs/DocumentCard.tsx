/**
 * DocumentCard - Visual preview card for a document
 * 
 * Renders a document as a card showing:
 * - Miniature preview of document content
 * - Title and last modified date
 * - Dropdown menu with delete option
 * 
 * Supports both grid and list view modes.
 */

import { FileText, MoreVertical, Trash2, Clock } from 'lucide-react';
import { Note } from '../notes/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DocumentCardProps {
  document: Note;
  onSelect: (doc: Note) => void;
  onDelete: (doc: Note) => void;
  viewMode: 'grid' | 'list';
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onSelect,
  onDelete,
  viewMode
}) => {
  // Extract text preview from content (strip HTML if rich text)
  const getPreview = (content: string, isRichText: boolean) => {
    if (isRichText) {
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = content;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
    return content;
  };

  const preview = getPreview(document.data.contents, document.data.isRichText || false);
  const truncatedPreview = preview.slice(0, 100);

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) {
      return 'Unknown';
    }
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-accent active:bg-accent/80 cursor-pointer transition-colors touch-manipulation"
        onClick={() => onSelect(document)}
      >
        <div className="flex-shrink-0">
          <div className="w-6 h-8 md:w-8 md:h-10 flex items-center justify-center text-primary">
            <FileText className="h-5 w-5 md:h-6 md:w-6" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm md:text-base text-foreground truncate">{document.data.title}</h3>
          <div className="flex items-center gap-1 md:gap-2 text-xs text-muted-foreground mt-0.5 md:mt-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(document.timestamp)}</span>
          </div>
        </div>
        <div className="flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(document);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group relative">
      <div
        onClick={() => onSelect(document)}
        className="cursor-pointer rounded-lg border bg-card hover:shadow-md active:shadow-lg transition-shadow overflow-hidden touch-manipulation"
      >
        {/* Document Preview */}
        <div className="aspect-[3/4] bg-background">
          <div className="p-3 md:p-4 h-full flex flex-col">
            {/* Mini Document View */}
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs md:text-sm font-semibold text-foreground line-clamp-2">
                {document.data.title}
              </h4>
              <div className="text-[8px] md:text-[9px] leading-relaxed text-muted-foreground space-y-1">
                {document.data.isRichText ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: document.data.contents }}
                    className="[&_h1]:text-xs [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:text-foreground [&_h2]:text-[10px] [&_h2]:font-semibold [&_h2]:mb-1 [&_h2]:text-foreground [&_p]:text-[8px] md:[&_p]:text-[9px] [&_p]:mb-1 [&_p]:text-muted-foreground [&_ul]:text-[8px] md:[&_ul]:text-[9px] [&_ol]:text-[8px] md:[&_ol]:text-[9px] [&_li]:mb-0.5 line-clamp-[10] md:line-clamp-[12]"
                  />
                ) : (
                  <p className="line-clamp-[10] md:line-clamp-[12] whitespace-pre-wrap text-muted-foreground">
                    {preview || 'Start writing...'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Document Info */}
        <div className="p-2 md:p-3 bg-card border-t flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs md:text-sm font-medium text-foreground truncate">
              {document.data.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 md:mt-1">
              <FileText className="h-2.5 md:h-3 w-2.5 md:w-3 text-muted-foreground flex-shrink-0" />
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                {formatDate(document.timestamp)}
              </p>
            </div>
          </div>

          {/* Menu Button - always visible on mobile for easier access */}
          <div className="flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 touch-manipulation">
                  <MoreVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(document);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
