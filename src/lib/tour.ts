import { Step } from 'react-joyride';

export const tourSteps: Step[] = [
  {
    target: '.app-logo',
    content: 'Welcome to On Mind! Let\'s take a quick tour of the main features. Click the help icon next to settings anytime to restart this tour.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.search-input',
    content: 'Quickly find any entry by searching through titles, content, tags, and explanations. The search is instant and works across all your entries.',
    placement: 'bottom',
  },
  {
    target: '.add-entry-button',
    content: 'Create new entries with rich content, URLs, and YouTube video integration. You can format text with line breaks and add clickable links.',
    placement: 'bottom',
  },
  {
    target: '.quick-note-button',
    content: 'Quickly capture thoughts and ideas with the Quick Note feature. Quick notes are automatically tagged and categorized for easy organization.',
    placement: 'bottom',
  },
  {
    target: '.youtube-autofill',
    content: 'When adding YouTube URLs, enable auto-fill to automatically fetch video details and add the channel as a tag. This helps organize your video collection by creator.',
    placement: 'bottom',
  },
  {
    target: '.youtube-watch-button',
    content: 'Watch YouTube videos directly in the app with our custom video player. Keyboard shortcuts make playback easy:\n• Space: Play/Pause\n• M: Mute/Unmute\n• Left/Right: Navigate playlist\n• Up/Down: Adjust volume',
    placement: 'bottom',
  },
  {
    target: '.view-toggle',
    content: 'Switch between three view modes:\n• Card: Rich visual layout\n• Row: Balanced view with details\n• Line: Compact list for managing many entries',
    placement: 'bottom',
  },
  {
    target: '.categories-section',
    content: 'Organize entries by categories:\n• Click to filter\n• Click again to clear\n• Add custom categories\n• Rename or delete categories\n• The YouTube category automatically collects all your saved videos',
    placement: 'bottom',
  },
  {
    target: '.tags-section',
    content: 'Use tags for flexible organization:\n• Click to filter\n• Combine multiple tags\n• Sort by name, frequency, or recent\n• YouTube tags show video counts\n• Click play on tags to watch all videos\n• Tags are automatically added from channels',
    placement: 'bottom',
  },
  {
    target: '.settings-button',
    content: 'Access powerful settings:\n• Customize interface features\n• Manage categories\n• Configure YouTube preferences\n• Import/Export your data\n• Manage your account',
    placement: 'bottom',
  }
];