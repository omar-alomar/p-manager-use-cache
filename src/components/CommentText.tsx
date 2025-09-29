"use client"

import { parseMentions, renderMentions } from "@/utils/mentions"
import { MentionedUser } from "./MentionedUser"

interface CommentTextProps {
  text: string
  className?: string
}

export function CommentText({ text, className = "" }: CommentTextProps) {
  const mentions = parseMentions(text)
  
  // If there are no mentions, just render the text with line breaks
  if (mentions.length === 0) {
    return (
      <div 
        className={`comment-text ${className}`}
        dangerouslySetInnerHTML={{ 
          __html: text.replace(/\n/g, '<br>') 
        }}
      />
    )
  }
  
  // Split text by mentions and render each part
  const parts: (string | { type: 'mention'; username: string })[] = []
  let lastIndex = 0
  
  mentions.forEach(mention => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, mention.startIndex)
      if (textBefore) {
        parts.push(textBefore)
      }
    }
    
    // Add mention
    parts.push({
      type: 'mention',
      username: mention.username
    })
    
    lastIndex = mention.endIndex
  })
  
  // Add remaining text after last mention
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex)
    if (textAfter) {
      parts.push(textAfter)
    }
  }
  
  return (
    <div className={`comment-text ${className}`}>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return (
            <span 
              key={`text-${index}`}
              dangerouslySetInnerHTML={{ 
                __html: part.replace(/\n/g, '<br>') 
              }}
            />
          )
        } else {
          return (
            <MentionedUser 
              key={`mention-${index}`}
              username={part.username}
            />
          )
        }
      })}
    </div>
  )
}
