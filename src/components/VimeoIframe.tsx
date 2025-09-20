import React from 'react';

type VimeoIframeProps = {
  videoId: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
};

export function VimeoIframe({
  videoId,
  autoplay = false,
  loop = false,
  muted = false,
  controls = false
}: VimeoIframeProps) {
  // Build Vimeo embed URL with parameters
  const embedUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
  
  if (autoplay) embedUrl.searchParams.set('autoplay', '1');
  if (loop) {
    embedUrl.searchParams.set('loop', '1');
    // For Vimeo loop to work properly, we also need to set background mode
    embedUrl.searchParams.set('background', '1');
  }
  if (muted) embedUrl.searchParams.set('muted', '1');
  if (!controls) embedUrl.searchParams.set('controls', '0');
  
  // Additional parameters for clean embed
  embedUrl.searchParams.set('title', '0');
  embedUrl.searchParams.set('byline', '0');
  embedUrl.searchParams.set('portrait', '0');
  
  // Only set background if not already set by loop
  if (!loop) {
    embedUrl.searchParams.set('background', '1');
  }

  return (
    <iframe
      src={embedUrl.toString()}
      className="absolute inset-0 w-full h-full"
      frameBorder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title="Vimeo video player"
    />
  );
}
