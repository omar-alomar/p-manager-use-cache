import prisma from "./db"

export async function getProjectComments(projectId: string | number) {
  "use cache"

  await wait(500)
  return prisma.comment.findMany({ 
    where: { projectId: Number(projectId) },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createComment(projectId: string | number, email: string, body: string) {
  await wait(500)
  
  return prisma.comment.create({
    data: {
      projectId: Number(projectId),
      email,
      body
    }
  })
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
