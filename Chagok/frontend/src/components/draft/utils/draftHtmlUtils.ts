import DOMPurify from 'dompurify';
import {
  SANITIZE_OPTIONS,
  textToHtml,
  preserveSpaces,
  stripHtml,
} from './htmlSanitizer';
import {
  generateId,
  formatAutosaveStatus,
  formatVersionReason,
  formatTimestamp,
} from './draftFormatters';

export const sanitizeDraftHtml = (html: string): string => {
  const cleanedInput = html.replace(/&nbsp;/g, ' ');

  if (typeof window === 'undefined') return cleanedInput;

  const converted = textToHtml(cleanedInput);
  const withPreservedSpaces = preserveSpaces(converted);
  return DOMPurify.sanitize(withPreservedSpaces, SANITIZE_OPTIONS);
};

export {
  textToHtml,
  preserveSpaces,
  stripHtml,
  generateId,
  formatAutosaveStatus,
  formatVersionReason,
  formatTimestamp,
};
