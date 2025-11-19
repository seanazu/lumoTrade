import html2canvas from 'html2canvas';

export interface ScreenshotOptions {
  backgroundColor?: string;
  scale?: number;
  quality?: number;
}

export async function captureElement(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<string> {
  const {
    backgroundColor = '#ffffff',
    scale = 2,
    quality = 0.95,
  } = options;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas.toDataURL('image/png', quality);
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw new Error('Failed to capture screenshot');
  }
}

export async function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyToClipboard(dataUrl: string) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
}

export function shareToTwitter(text: string, url?: string) {
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.set('text', text);
  if (url) {
    twitterUrl.searchParams.set('url', url);
  }
  window.open(twitterUrl.toString(), '_blank');
}

