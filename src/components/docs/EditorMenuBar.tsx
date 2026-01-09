import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Sun,
  Moon,
  Download,
  FileDown,
  Loader2,
  ChevronDown,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToDocx, exportToPdf } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';

interface EditorMenuBarProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onBack: () => void;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({
  title,
  content,
  onTitleChange,
  onBack
}) => {
  const { theme, setTheme } = useTheme();
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);

  const handleExportPdf = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Please add a title before exporting', variant: 'destructive' });
      return;
    }
    setIsExporting('pdf');
    try {
      await exportToPdf({ title, content });
      toast({ title: 'Success', description: 'PDF exported successfully' });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportDocx = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Please add a title before exporting', variant: 'destructive' });
      return;
    }
    setIsExporting('docx');
    try {
      await exportToDocx({ title, content });
      toast({ title: 'Success', description: 'DOCX exported successfully' });
    } catch (error) {
      console.error('DOCX export failed:', error);
      toast({ title: 'Error', description: 'Failed to export DOCX', variant: 'destructive' });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="border-b bg-card">
      {/* Title and actions */}
      <div className="px-3 md:px-4 py-2 md:py-3 flex items-center gap-2 md:gap-3">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="flex-shrink-0 h-9 w-9 md:h-10 md:w-10"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        {/* File Menu - Google Docs style */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-2 md:px-3 text-sm font-medium gap-1"
            >
              <File className="h-4 w-4" />
              <span className="hidden sm:inline">File</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting !== null}>
              <FileDown className="h-4 w-4 mr-3" />
              <div className="flex flex-col">
                <span>Download as PDF</span>
                <span className="text-xs text-muted-foreground">PDF Document (.pdf)</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportDocx} disabled={isExporting !== null}>
              <FileText className="h-4 w-4 mr-3" />
              <div className="flex flex-col">
                <span>Download as Word</span>
                <span className="text-xs text-muted-foreground">Microsoft Word (.docx)</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Title */}
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
          className="border-0 focus-visible:ring-0 text-sm md:text-base font-normal px-1 max-w-md flex-1 touch-manipulation"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto flex-shrink-0">
          {/* Prominent Download button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 md:h-9 px-2 md:px-3 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-0"
                disabled={isExporting !== null}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline font-medium">Export</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting !== null} className="cursor-pointer">
                <FileDown className="h-4 w-4 mr-2 text-red-500" />
                PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDocx} disabled={isExporting !== null} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            className="h-9 w-9 md:h-10 md:w-10"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorMenuBar;
