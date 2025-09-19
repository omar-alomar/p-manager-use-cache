import prisma from "./db"

export async function getTasks() {
  "use cache"
  
  await wait(500)
  return prisma.task.findMany({
    include: {
      Project: true,
      User: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}

export async function getTasksByCompletion(completed: boolean) {
  "use cache"
  
  await wait(500)
  return prisma.task.findMany({
    where: { completed },
    include: {
      Project: true,
      User: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
}



export async function getUserTasks(userId: string | number) {
  "use cache"
  
  await wait(500)
  return prisma.task.findMany({ 
    where: { userId: Number(userId) },
    include: {
      Project: true,
      User: true
    }
  })
}

export async function getProjectTasks(projectId: string | number) {
  "use cache"
  
  await wait(500)
  return prisma.task.findMany({ 
    where: { projectId: Number(projectId) },
    include: {
      Project: true,
      User: true
    }
  })
}

export async function getTask(taskId: string | number) {
  "use cache"
  
  await wait(500)
  return prisma.task.findUnique({ 
    where: { id: Number(taskId) },
    include: {
      Project: true,
      User: true
    }
  })
}

export async function createTask({
  title,
  completed,
  userId,
  projectId,
  assignedById,
}: {
  title: string
  completed: boolean
  userId: number
  projectId?: number
  assignedById?: number
}) {
  // Use a transaction to ensure consistency
  const task = await prisma.$transaction(async (tx) => {
    return tx.task.create({
      data: {
        title,
        completed,
        userId,
        projectId: projectId || null,
        assignedById: assignedById || null,
      },
    })
  })

  return task
}

export async function updateTask(
  taskId: string | number,
  {
    title,
    completed,
    userId,
    projectId
   }:{
     title: string,
     completed: boolean,
     userId: number,
     projectId?: number
  }) {
  console.log('updateTask called with:', { taskId, title, completed, userId, projectId })
  
  // Use transaction for consistency
  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: Number(taskId) },
      data: {
        title,
        completed,
        userId,
        projectId: projectId || null,
        updatedAt: new Date()
      },
    })
    
    // Verify the update within the transaction
    const verified = await tx.task.findUnique({
      where: { id: Number(taskId) }
    })
    
    console.log('Task after update (in transaction):', verified)
    
    return updated
  })
  
  // Double-check outside transaction
  const finalCheck = await prisma.task.findUnique({
    where: { id: Number(taskId) }
  })
  console.log('Final task state:', finalCheck)

  return task
}

export async function deleteTask(taskId: string | number) {
  const task = await prisma.$transaction(async (tx) => {
    return tx.task.delete({ where: { id: Number(taskId) } })
  })

  return task
}

function wait(duration: number) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}