import type { Entry } from './firebase-client';

export function exportToCSV(entries: Entry[]) {
  // Define CSV headers
  const headers = [
    'Title',
    'Content',
    'Explanation',
    'URL',
    'Category',
    'Tags',
    'Favorite',
    'Pinned',
    'Created At',
    'Updated At'
  ];

  // Transform entries to CSV rows
  const rows = entries.map(entry => [
    entry.title,
    entry.content,
    entry.explanation || '',
    entry.url || '',
    entry.category,
    entry.tags.join('; '),
    entry.is_favorite ? 'Yes' : 'No',
    entry.is_pinned ? 'Yes' : 'No',
    new Date(entry.created_at).toLocaleString(),
    new Date(entry.updated_at).toLocaleString()
  ]);

  // Escape CSV values properly
  const escapeCsvValue = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Create CSV content
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `on-mind-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateCSVTemplate() {
  const headers = [
    'Title',
    'Content',
    'Explanation',
    'URL',
    'Category',
    'Tags',
    'Favorite',
    'Pinned'
  ];

  const sampleRow = [
    'Example Title',
    'Example content goes here',
    'Optional explanation or notes about the entry',
    'https://example.com',
    'Main',
    'tag1; tag2; tag3',
    'No',
    'No'
  ];

  const csvContent = [
    headers.join(','),
    sampleRow.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'on-mind-import-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importFromCSV(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const content = await file.text();
    const lines = content.split('\n');
    
    if (lines.length < 2) {
      return {
        success: false,
        message: 'CSV file is empty or invalid'
      };
    }

    const headers = lines[0].toLowerCase().split(',');
    const requiredHeaders = ['title', 'content', 'category'];
    
    // Verify required headers
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        return {
          success: false,
          message: `Missing required column: ${required}`
        };
      }
    }

    // Parse rows (skip header)
    const entries = lines.slice(1).map(line => {
      const values = line.split(',').map(value => 
        value.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"')
      );
      
      const entry: Partial<Entry> = {
        title: values[headers.indexOf('title')],
        content: values[headers.indexOf('content')],
        category: values[headers.indexOf('category')],
        explanation: headers.includes('explanation') ? values[headers.indexOf('explanation')] : '',
        url: headers.includes('url') ? values[headers.indexOf('url')] : '',
        tags: headers.includes('tags') 
          ? values[headers.indexOf('tags')].split(';').map(tag => tag.trim()).filter(Boolean)
          : [],
        is_favorite: headers.includes('favorite') 
          ? values[headers.indexOf('favorite')].toLowerCase() === 'yes'
          : false,
        is_pinned: headers.includes('pinned')
          ? values[headers.indexOf('pinned')].toLowerCase() === 'yes'
          : false
      };

      return entry;
    });

    return {
      success: true,
      message: `Successfully parsed ${entries.length} entries`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to parse CSV file'
    };
  }
}