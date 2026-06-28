import { PrismaClient } from '@prisma/client'
import { MATCHES } from '../src/lib/seed-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const existing = await prisma.match.count()
  if (existing > 0) {
    console.log(`✅ Database already has ${existing} matches. Skipping seed.`)
    return
  }

  await prisma.match.createMany({
    data: MATCHES,
  })

  console.log(`✅ Successfully seeded ${MATCHES.length} matches!`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
