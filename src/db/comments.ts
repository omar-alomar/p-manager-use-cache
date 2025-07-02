import prisma from "./db"

export async function getProjectComments(projectId: string | number) {
  "use cache"

  await wait(2000)
  return prisma.comment.findMany({ where: { projectId: Number(projectId) } })
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}
