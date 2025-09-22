export const DEFAULT_CATEGORIES = [
  'Ideas',
  'Quick Note', 
  'Journal',
  'Flash Card',
  'YouTube',
  'Code Vault',
  'Reference',
  'Uncategorized'
] as const;

export type Category = string;

// Intro video that serves as default content
export const INTRO_VIDEO = {
  id: 'intro-splash-video',
  title: 'Welcome to On Mind',
  content: 'This is your personal knowledge base and YouTube companion. Watch this introduction to learn how to make the most of On Mind.',
  explanation: 'On Mind helps you organize your thoughts and knowledge. You can:\n\n• Save and organize YouTube videos with notes\n• Create quick notes, ideas, and journal entries\n• Use categories and tags to organize everything\n• Search through your knowledge base\n• Star favorites and pin important items\n• Export your data anytime\n\nClick the help icon (?) in the top bar to learn more about specific features.',
  url: 'https://vimeo.com/1120485703',
  category: 'Introduction',
  tags: ['introduction', 'tutorial', 'getting-started'],
  is_favorite: false,
  is_pinned: true,
  is_flashcard: false
} as const;