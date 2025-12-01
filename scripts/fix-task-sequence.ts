import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function fixSequences() {
  try {
    console.log('🔄 Resetting all sequences...\n')
    
    // Reset all sequences to match the maximum ID in each table
    const sequences = [
      { name: 'Task', table: 'Task' },
      { name: 'User', table: 'User' },
      { name: 'Project', table: 'Project' },
      { name: 'Client', table: 'Client' },
      { name: 'Comment', table: 'Comment' },
      { name: 'Milestone', table: 'Milestone' },
      { name: 'Mention', table: 'Mention' },
      { name: 'Notification', table: 'Notification' },
    ]
    
    for (const seq of sequences) {
      try {
        await prisma.$executeRawUnsafe(`
          SELECT setval('"${seq.name}_id_seq"', COALESCE((SELECT MAX(id) FROM "${seq.table}"), 1), true);
        `)
        
        const result = await prisma.$queryRawUnsafe<Array<{ last_value: number }>>(`
          SELECT last_value FROM "${seq.name}_id_seq";
        `)
        
        const maxId = await prisma.$queryRawUnsafe<Array<{ max: number | null }>>(`
          SELECT MAX(id) as max FROM "${seq.table}";
        `)
        
        console.log(`✅ ${seq.name}: sequence=${result[0]?.last_value || 'N/A'}, max_id=${maxId[0]?.max || 0}`)
      } catch (error: any) {
        // Some sequences might not exist yet, that's okay
        if (error.message?.includes('does not exist')) {
          console.log(`⚠️  ${seq.name}: sequence doesn't exist yet (this is normal if table is empty)`)
        } else {
          console.error(`❌ ${seq.name}: ${error.message}`)
        }
      }
    }
    
    console.log('\n✅ All sequences fixed successfully!')
  } catch (error) {
    console.error('❌ Error fixing sequences:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixSequences()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

