/**
 * Maps a specific archetype name to a hand-picked, high-quality, and stable image URL from Unsplash.
 * This approach uses direct, static image links instead of the unreliable dynamic keyword-based fetching
 * to ensure images always load correctly and are thematically appropriate.
 * @param archetypeName The full name of the archetype, e.g., "The Hero (英雄)".
 * @returns A string containing a direct URL to a curated image.
 */
export const getArchetypeImageUrl = (archetypeName: string): string => {
  // Trim whitespace from the name to ensure a clean match.
  const trimmedName = archetypeName.trim();

  // A map of archetypes to their specific photo IDs on Unsplash.
  // Using a map of IDs allows us to apply consistent, optimized URL parameters for performance.
  const imageIdMap: { [key: string]: string } = {
    "The Self (自性)": 'photo-1702631778188-f2a534ed080f',
    "The Shadow (阴影)": 'photo-1717063357834-18ccc52e04a1',
    "The Anima (阿尼玛)": 'photo-1746309820957-3932314e5253',
    "The Animus (阿尼姆斯)": 'photo-1734637019892-8e7b841a6952',
    "The Persona (人格面具)": 'photo-1746309820747-ccfdd82c5567',
    "The Hero (英雄)": 'photo-1746557416401-ddc98991337e',
    "The Wise Old Man (智慧老人)": 'photo-1746309820534-896951910b9c',
    "The Great Mother (大母神)": 'photo-1718267391251-55e4246daf64',
    "The Puer Aeternus (永恒少年)": 'photo-1746557416355-b41fc2cc213c',
    "The Trickster (捣蛋鬼)": 'photo-1746557416493-9d3ab4f6607d',
    "The Child (圣婴/儿童)": 'photo-1733578873682-664392be01e5',
    "The Father (父亲)": 'photo-1746469291605-e9195726bd46',
  };

  const imageId = imageIdMap[trimmedName];

  if (imageId) {
    // Reverted to simpler URL. Let the browser's `background-size: cover` handle the cropping.
    return `https://images.unsplash.com/${imageId}?w=800&q=80`;
  }

  // A generic fallback just in case, though it shouldn't be needed with the curated map.
  return 'https://images.unsplash.com/photo-1549402517-834b691a38fb?w=800&q=80';
};