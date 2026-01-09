/**
 * Document Export Utilities
 * 
 * Provides functions to export documents to various formats:
 * - PDF (via jsPDF)
 * - Microsoft Word .docx (via docx library)
 * 
 * Handles HTML content parsing and formatting preservation.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

/** Options for document export */
interface ExportOptions {
  /** Document title */
  title: string;
  /** HTML content to export */
  content: string;
}

/**
 * Convert HTML content to plain text with basic formatting preserved
 */
function htmlToTextRuns(html: string): Array<{ text: string; bold?: boolean; italic?: boolean }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const runs: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];

  function processNode(node: Node, bold = false, italic = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        runs.push({ text, bold, italic });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      let newBold = bold;
      let newItalic = italic;

      if (tagName === 'strong' || tagName === 'b') newBold = true;
      if (tagName === 'em' || tagName === 'i') newItalic = true;

      for (const child of Array.from(node.childNodes)) {
        processNode(child, newBold, newItalic);
      }
    }
  }

  processNode(doc.body);
  return runs;
}

/**
 * Parse HTML content into structured paragraphs for DOCX
 */
function parseHtmlToParagraphs(html: string): Paragraph[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs: Paragraph[] = [];

  function processElement(element: Element): Paragraph | null {
    const tagName = element.tagName.toLowerCase();

    // Handle headings
    if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1]);
      const headingMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };

      return new Paragraph({
        heading: headingMap[level],
        children: [new TextRun({ text: element.textContent || '', bold: true })],
      });
    }

    // Handle paragraphs and divs
    if (tagName === 'p' || tagName === 'div') {
      const runs = htmlToTextRuns(element.innerHTML);
      if (runs.length === 0) {
        return new Paragraph({ children: [] }); // Empty paragraph for spacing
      }

      return new Paragraph({
        children: runs.map(run => new TextRun({
          text: run.text,
          bold: run.bold,
          italics: run.italic,
        })),
      });
    }

    // Handle lists
    if (tagName === 'ul' || tagName === 'ol') {
      const listItems = element.querySelectorAll(':scope > li');
      const listParagraphs: Paragraph[] = [];

      listItems.forEach((li, index) => {
        const bullet = tagName === 'ul' ? '• ' : `${index + 1}. `;
        listParagraphs.push(new Paragraph({
          children: [new TextRun({ text: bullet + (li.textContent || '') })],
          indent: { left: 720 }, // 0.5 inch indent
        }));
      });

      return null; // Lists are handled separately
    }

    // Handle blockquotes
    if (tagName === 'blockquote') {
      return new Paragraph({
        children: [new TextRun({ text: element.textContent || '', italics: true })],
        indent: { left: 720 },
      });
    }

    // Handle code blocks
    if (tagName === 'pre' || tagName === 'code') {
      return new Paragraph({
        children: [new TextRun({
          text: element.textContent || '',
          font: 'Courier New',
          size: 20, // 10pt
        })],
        shading: { fill: 'F5F5F5' },
      });
    }

    return null;
  }

  // Process all top-level elements
  const body = doc.body;
  for (const child of Array.from(body.children)) {
    // Handle lists specially - they need multiple paragraphs
    if (child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'ol') {
      const listItems = child.querySelectorAll(':scope > li');
      const isOrdered = child.tagName.toLowerCase() === 'ol';

      listItems.forEach((li, index) => {
        const bullet = isOrdered ? `${index + 1}. ` : '• ';
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: bullet + (li.textContent || '') })],
          indent: { left: 720 },
        }));
      });
    } else {
      const para = processElement(child);
      if (para) {
        paragraphs.push(para);
      }
    }
  }

  // If no paragraphs found, try to extract text directly
  if (paragraphs.length === 0 && body.textContent?.trim()) {
    const lines = body.innerHTML.split(/<br\s*\/?>/i);
    for (const line of lines) {
      const text = line.replace(/<[^>]*>/g, '').trim();
      if (text) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text })],
        }));
      }
    }
  }

  return paragraphs;
}

/**
 * Export document as DOCX file
 */
export async function exportToDocx({ title, content }: ExportOptions): Promise<void> {
  const paragraphs = parseHtmlToParagraphs(content);

  // Add title as first heading
  const titleParagraph = new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: title, bold: true, size: 48 })],
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [titleParagraph, new Paragraph({ children: [] }), ...paragraphs],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'document'}.docx`;
  saveAs(blob, filename);
}

/**
 * Export document as PDF file using jsPDF
 */
export async function exportToPdf({ title, content }: ExportOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Add title centered
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, maxWidth);
  const titleWidth = doc.getTextWidth(titleLines[0]);
  doc.text(titleLines, (pageWidth - titleWidth) / 2, y);
  y += titleLines.length * 30 + 20;

  // Parse HTML content
  const textBlocks = parseHtmlToTextBlocks(content);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  for (const block of textBlocks) {
    // Check if we need a new page
    if (y > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
    }

    // Set font based on block type
    switch (block.type) {
      case 'h1':
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        break;
      case 'h2':
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        break;
      case 'h3':
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        break;
      case 'li':
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        break;
      default:
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
    }

    // Add indent for list items
    const xOffset = block.type === 'li' ? margin + 15 : margin;
    const textMaxWidth = block.type === 'li' ? maxWidth - 15 : maxWidth;

    // Split text to fit width
    const lines = doc.splitTextToSize(block.text, textMaxWidth);

    // Calculate line height based on font size
    const lineHeight = doc.getFontSize() * 1.4;

    // Check if block fits on current page
    const blockHeight = lines.length * lineHeight;
    if (y + blockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Draw the text
    doc.text(lines, xOffset, y);
    y += blockHeight + 8; // Add spacing after block
  }

  const filename = `${title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'document'}.pdf`;
  doc.save(filename);
}

interface TextBlock {
  type: 'p' | 'h1' | 'h2' | 'h3' | 'li' | 'text';
  text: string;
}

/**
 * Parse HTML content into text blocks for PDF rendering
 */
function parseHtmlToTextBlocks(html: string): TextBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: TextBlock[] = [];

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({ type: 'text', text });
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Handle block elements
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const text = element.textContent?.trim();
        if (text) {
          blocks.push({ type: tagName as 'h1' | 'h2' | 'h3', text });
        }
        return;
      }

      if (tagName === 'p' || tagName === 'div') {
        const text = element.textContent?.trim();
        if (text) {
          blocks.push({ type: 'p', text });
        }
        return;
      }

      if (tagName === 'li') {
        const text = element.textContent?.trim();
        if (text) {
          blocks.push({ type: 'li', text: '• ' + text });
        }
        return;
      }

      if (tagName === 'br') {
        return;
      }

      // Process children for other elements
      for (const child of Array.from(node.childNodes)) {
        processNode(child);
      }
    }
  }

  // Process all children of body
  for (const child of Array.from(doc.body.childNodes)) {
    processNode(child);
  }

  // If no blocks found, try to get plain text
  if (blocks.length === 0) {
    const plainText = doc.body.textContent?.trim();
    if (plainText) {
      // Split by newlines
      const lines = plainText.split(/\n+/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          blocks.push({ type: 'p', text: trimmed });
        }
      }
    }
  }

  return blocks;
}

