/**
 * Utility functions for parsing and handling user mentions in comments
 */

export interface ParsedMention {
  username: string
  startIndex: number
  endIndex: number
}

/**
 * Parse mentions from comment text (e.g., @username)
 * Returns an array of mention objects with username and position info
 */
export function parseMentions(text: string): ParsedMention[] {
  // Updated regex to capture full names (first and last name)
  const mentionRegex = /@(\w+\s+\w+)/g
  const mentions: ParsedMention[] = []
  let match

  console.log('Parsing mentions in text:', text)

  while ((match = mentionRegex.exec(text)) !== null) {
    console.log('Found mention match:', match[1], 'at position', match.index)
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  console.log('Parsed mentions result:', mentions)
  return mentions
}

/**
 * Replace mentions in text with HTML links or styled spans
 * @param text - The original text
 * @param mentions - Array of parsed mentions
 * @param renderMention - Function to render each mention
 */
export function renderMentions(
  text: string, 
  mentions: ParsedMention[], 
  renderMention: (username: string, mention: ParsedMention) => string
): string {
  if (mentions.length === 0) return text

  // Sort mentions by start index in descending order to avoid index shifting
  const sortedMentions = [...mentions].sort((a, b) => b.startIndex - a.startIndex)
  
  let result = text
  
  for (const mention of sortedMentions) {
    const before = result.substring(0, mention.startIndex)
    const after = result.substring(mention.endIndex)
    const rendered = renderMention(mention.username, mention)
    
    result = before + rendered + after
  }
  
  return result
}

/**
 * Extract unique usernames from mentions
 */
export function extractMentionedUsernames(mentions: ParsedMention[]): string[] {
  return [...new Set(mentions.map(m => m.username))]
}

/**
 * Check if a user is mentioned in a comment
 */
export function isUserMentioned(text: string, username: string): boolean {
  const mentions = parseMentions(text)
  return mentions.some(m => m.username.toLowerCase() === username.toLowerCase())
}
