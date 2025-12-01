import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkTaskSequence() {
  try {
    // Get the current sequence value
    const seqResult = await prisma.$queryRawUnsafe<Array<{ last_value: number }>>(`
      SELECT last_value FROM "Task_id_seq";
    `)
    
    // Get the max ID in the table
    const maxIdResult = await prisma.$queryRawUnsafe<Array<{ max: number | null }>>(`
      SELECT MAX(id) as max FROM "Task";
    `)
    
    const currentSeqValue = seqResult[0]?.last_value || 0
    const maxId = maxIdResult[0]?.max || 0
    
    console.log('📊 Task Sequence Status:')
    console.log(`   Current sequence value: ${currentSeqValue}`)
    console.log(`   Max ID in table: ${maxId}`)
    console.log(`   Next ID that will be used: ${currentSeqValue + 1}`)
    
    if (currentSeqValue < maxId) {
      console.log('⚠️  WARNING: Sequence is behind! It will try to use an ID that already exists.')
      console.log(`   Need to reset sequence to: ${maxId}`)
    } else if (currentSeqValue === maxId) {
      console.log('✅ Sequence is correct! Next ID will be:', maxId + 1)
    } else {
      console.log('✅ Sequence is ahead (this is fine, means there were deletions)')
    }
    
    // Count total tasks
    const count = await prisma.task.count()
    console.log(`\n   Total tasks in database: ${count}`)
    
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      console.error('❌ Sequence "Task_id_seq" does not exist!')
      console.error('   Run fix-sequences.sql to create it.')
    } else {
      console.error('❌ Error checking sequence:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkTaskSequence()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

