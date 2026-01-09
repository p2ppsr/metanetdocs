import React from 'react';
import { Sparkles, Wand2, FileText, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIAssistantButtonsProps {
  onGenerateDocument?: () => void;
  onHelpMeWrite?: () => void;
  onTemplates?: () => void;
  onMore?: () => void;
}

const AIAssistantButtons: React.FC<AIAssistantButtonsProps> = ({
  onGenerateDocument,
  onHelpMeWrite,
  onTemplates,
  onMore
}) => {
  return (
    <div className="flex items-center gap-2 py-4">
      <Button
        variant="default"
        size="sm"
        onClick={onGenerateDocument}
        className="gap-2 bg-primary hover:bg-primary/90"
      >
        <Sparkles className="h-4 w-4" />
        Generate document
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onHelpMeWrite}
        className="gap-2"
      >
        <Wand2 className="h-4 w-4" />
        Help me write
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onTemplates}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Templates
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onMore}
        className="gap-2"
      >
        <MoreHorizontal className="h-4 w-4" />
        More
      </Button>
    </div>
  );
};

export default AIAssistantButtons;
