export const DEFAULT_CATEGORIES = [
  'Ideas',
  'Quick Note', 
  'Journal',
  'Flash Card',
  'YouTube',
  'Code Vault',
  'Reference'
] as const;

export type Category = string;

// Intro video that serves as default content
export const INTRO_VIDEO = {
  id: 'intro-splash-video',
  title: 'Welcome to On Mind',
  content: 'This is your personal knowledge base and YouTube companion. Watch this introduction to learn how to make the most of On Mind.',
  explanation: 'A quick walkthrough of On Mind\'s features and capabilities. Perfect for getting started with your personal knowledge management journey.',
  url: 'https://vimeo.com/1120444357',
  category: 'Introduction',
  tags: ['introduction', 'tutorial', 'getting-started'],
  is_favorite: false,
  is_pinned: true,
  is_flashcard: false
} as const;