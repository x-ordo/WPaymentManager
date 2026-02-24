/**
 * HTML Sanitization Utilities
 * Extracted from DraftPreviewPanel for reusability
 */

/**
 * DOMPurify sanitization options for legal document HTML
 */
export const SANITIZE_OPTIONS = {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'span', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4'],
    ALLOWED_ATTR: ['class', 'data-evidence-id', 'data-comment-id', 'data-change-id'],
};

/**
 * Convert plain text (with \n newlines) to HTML
 * - Preserves whitespace (spaces, indentation) for legal document formatting
 * - Double newlines become paragraph breaks
 * - Single newlines become <br>
 * - Escapes HTML entities
 * - Converts multiple spaces to &nbsp; to preserve indentation
 */
export const textToHtml = (text: string): string => {
    if (!text) return '';

    // If it already looks like HTML, return as-is
    if (text.includes('<p>') || text.includes('<br') || text.includes('<h1>')) {
        return text;
    }

    // Escape HTML entities
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Helper to preserve spaces within text
    const preserveSpacesInText = (str: string): string => {
        // First, preserve leading spaces in each line
        return str.replace(/^( +)/gm, (match) => {
            return match.replace(/ /g, '&nbsp;');
        })
        // Then preserve multiple consecutive spaces within text
        .replace(/  +/g, (match) => {
            return match.replace(/ /g, '&nbsp;');
        });
    };

    // Split by double newlines for paragraphs
    const paragraphs = escaped.split(/\n\n+/);

    // Convert single newlines to <br> within paragraphs
    const htmlParagraphs = paragraphs.map(p => {
        const withSpaces = preserveSpacesInText(p);
        const withBreaks = withSpaces.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
    });

    return htmlParagraphs.join('\n');
};

/**
 * Preserve leading spaces and multiple consecutive spaces for legal document formatting
 * Converts spaces to non-breaking spaces for proper rendering in HTML
 * Must be applied AFTER textToHtml to avoid escaping issues
 */
export const preserveSpaces = (html: string): string => {
    // Convert leading spaces at the start of each line to non-breaking spaces
    // Also convert multiple consecutive spaces to preserve formatting
    return html
        .replace(/^( +)/gm, (match) => match.replace(/ /g, '\u00A0'))
        .replace(/  +/g, (match) => match.replace(/ /g, '\u00A0'));
};

/**
 * Strip HTML tags from content, returning plain text
 */
export const stripHtml = (html: string): string => html.replace(/<[^>]+>/g, '').trim();
