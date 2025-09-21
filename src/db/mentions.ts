import prisma from "./db"

/**
 * Create mentions for a comment
 */
export async function createMentions(commentId: number, usernames: string[]) {
  if (usernames.length === 0) return []

  console.log('Creating mentions for comment', commentId, 'with usernames:', usernames)

  // Get user IDs for the mentioned usernames (exact matches only)
  const users = await prisma.user.findMany({
    where: {
      name: {
        in: usernames
      }
    },
    select: {
      id: true,
      name: true
    }
  })

  console.log('Found users for mentions:', users)

  // Create mentions
  const mentions = await Promise.all(
    users.map(user => 
      prisma.mention.upsert({
        where: {
          commentId_userId: {
            commentId,
            userId: user.id
          }
        },
        create: {
          commentId,
          userId: user.id
        },
        update: {
          // Update timestamp if mention already exists
          createdAt: new Date()
        }
      })
    )
  )

  console.log('Created mentions:', mentions)
  return mentions
}

/**
 * Create notifications for mentioned users
 */
export async function createMentionNotifications(
  commentId: number, 
  mentionedUserIds: number[], 
  commentAuthorName: string
) {
  if (mentionedUserIds.length === 0) return []

  // Get the comment to create proper notification messages
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      project: { select: { title: true } },
      task: { select: { title: true } }
    }
  })

  if (!comment) return []

  // Create notification message
  let message = `${commentAuthorName} mentioned you in a comment`
  if (comment.project) {
    message += ` on project "${comment.project.title}"`
  } else if (comment.task) {
    message += ` on task "${comment.task.title}"`
  }

  // Get all mentions for this comment
  const mentions = await prisma.mention.findMany({
    where: { commentId }
  })

  // Create notifications for each mentioned user
  const notifications = await Promise.all(
    mentionedUserIds.map(async (userId) => {
      const mention = mentions.find(m => m.userId === userId)
      if (!mention) return null

      return prisma.notification.create({
        data: {
          mentionId: mention.id,
          userId,
          type: 'mention',
          message
        }
      })
    })
  )

  return notifications.filter(Boolean)
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: number, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      mention: {
        include: {
          comment: {
            include: {
              user: { select: { name: true, email: true } },
              project: { select: { title: true } },
              task: { select: { title: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      read: true
    }
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false
    },
    data: {
      read: true
    }
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: number) {
  return prisma.notification.count({
    where: {
      userId,
      read: false
    }
  })
}
