import React from 'react';
import { format } from 'date-fns';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return format(date, 'MMM d, h:mm a');
}

export function formatTextWithLinks(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex for matching URLs
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

  let lastIndex = 0;
  const result: React.ReactNode[] = [];
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      const lines = textBefore.split('\n');
      lines.forEach((line, lineIndex) => {
        if (line) result.push(line);
        if (lineIndex < lines.length - 1) {
          result.push(React.createElement('br', { key: `br-${lastIndex}-${lineIndex}` }));
        }
      });
    }

    // Add the URL as a link
    result.push(
      React.createElement('a', {
        key: `link-${match.index}`,
        href: match[0],
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'text-[#2d9edb] hover:text-[#2d9edb]/80 transition-colors',
        children: match[0]
      })
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  const textAfter = text.slice(lastIndex);
  if (textAfter) {
    const lines = textAfter.split('\n');
    lines.forEach((line, lineIndex) => {
      if (line) result.push(line);
      if (lineIndex < lines.length - 1) {
        result.push(React.createElement('br', { key: `br-${lastIndex}-${lineIndex}` }));
      }
    });
  }

  return result;
}

export function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}