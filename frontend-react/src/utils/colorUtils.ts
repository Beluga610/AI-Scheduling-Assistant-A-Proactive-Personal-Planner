// src/utils/colorUtils.ts
export const extractNameFromTitle = (title: string): string => {
  const match = title.match(/with\s+([A-Z][a-zA-Z]*)/i);
  if (match) return match[1];
  
  const firstWord = title.split(' ')[0];
  return firstWord.length < 10 ? firstWord : "Others";
};

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const h = Math.abs(hash) % 360;
  const s = 70; 
  const l = 85;

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const stringToDarkColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 40%)`;
};