import prisma from "./db"

export async function getProjectComments(projectId: string | number) {
  "use cache"

  await wait(500)
  return prisma.comment.findMany({ 
    where: { projectId: Number(projectId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createComment(projectId: string | number, email: string, body: string, userId: number) {
  await wait(500)
  
  return prisma.comment.create({
    data: {
      projectId: Number(projectId),
      email,
      body,
      userId
    }
  })
}

export async function deleteComment(commentId: number) {
  await wait(500)
  
  return prisma.comment.delete({
    where: { id: commentId }
  })
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
