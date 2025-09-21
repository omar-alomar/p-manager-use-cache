"use client"

import { parseMentions, renderMentions } from "@/utils/mentions"

interface CommentTextProps {
  text: string
  className?: string
}

export function CommentText({ text, className = "" }: CommentTextProps) {
  const mentions = parseMentions(text)
  
  const renderMention = (username: string) => {
    return `<span class="mention" data-username="${username}">@${username}</span>`
  }
  
  // Process mentions first, then convert newlines to <br> tags
  let renderedText = renderMentions(text, mentions, renderMention)
  renderedText = renderedText.replace(/\n/g, '<br>')
  
  return (
    <div 
      className={`comment-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedText }}
    />
  )
}
