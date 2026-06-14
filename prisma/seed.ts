import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MATCHES = [
  // Round 1 - 1ª Rodada
  { round: 1, matchNum: 1, homeTeam: 'MEX', awayTeam: 'AFS', homeName: 'México', awayName: 'África do Sul' },
  { round: 1, matchNum: 2, homeTeam: 'COR', awayTeam: 'TCH', homeName: 'Coreia do Sul', awayName: 'Tchéquia' },
  { round: 1, matchNum: 3, homeTeam: 'CAN', awayTeam: 'BOS', homeName: 'Canadá', awayName: 'Bósnia' },
  { round: 1, matchNum: 4, homeTeam: 'CAT', awayTeam: 'SUI', homeName: 'Catar', awayName: 'Suíça' },
  { round: 1, matchNum: 5, homeTeam: 'BRA', awayTeam: 'MAR', homeName: 'Brasil', awayName: 'Marrocos' },
  { round: 1, matchNum: 6, homeTeam: 'HAI', awayTeam: 'ESC', homeName: 'Haiti', awayName: 'Escócia' },
  { round: 1, matchNum: 7, homeTeam: 'EUA', awayTeam: 'PAR', homeName: 'Estados Unidos', awayName: 'Paraguai' },
  { round: 1, matchNum: 8, homeTeam: 'AUS', awayTeam: 'TUR', homeName: 'Austrália', awayName: 'Turquia' },
  { round: 1, matchNum: 9, homeTeam: 'ALE', awayTeam: 'CUR', homeName: 'Alemanha', awayName: 'Curaçao' },
  { round: 1, matchNum: 10, homeTeam: 'CDM', awayTeam: 'EQU', homeName: 'Comores', awayName: 'Equador' },
  { round: 1, matchNum: 11, homeTeam: 'HOL', awayTeam: 'JAP', homeName: 'Holanda', awayName: 'Japão' },
  { round: 1, matchNum: 12, homeTeam: 'SUE', awayTeam: 'TUN', homeName: 'Suécia', awayName: 'Tunísia' },
  { round: 1, matchNum: 13, homeTeam: 'BEL', awayTeam: 'EGI', homeName: 'Bélgica', awayName: 'Egito' },
  { round: 1, matchNum: 14, homeTeam: 'IRA', awayTeam: 'NZE', homeName: 'Irã', awayName: 'Nova Zelândia' },
  { round: 1, matchNum: 15, homeTeam: 'ESP', awayTeam: 'CAB', homeName: 'Espanha', awayName: 'Cabo Verde' },
  { round: 1, matchNum: 16, homeTeam: 'SAU', awayTeam: 'URU', homeName: 'Arábia Saudita', awayName: 'Uruguai' },
  { round: 1, matchNum: 17, homeTeam: 'FRA', awayTeam: 'SEN', homeName: 'França', awayName: 'Senegal' },
  { round: 1, matchNum: 18, homeTeam: 'IRQ', awayTeam: 'NOR', homeName: 'Iraque', awayName: 'Noruega' },
  { round: 1, matchNum: 19, homeTeam: 'ARG', awayTeam: 'AGL', homeName: 'Argentina', awayName: 'Angola' },
  { round: 1, matchNum: 20, homeTeam: 'AUT', awayTeam: 'JOR', homeName: 'Áustria', awayName: 'Jordânia' },
  { round: 1, matchNum: 21, homeTeam: 'POR', awayTeam: 'RDC', homeName: 'Portugal', awayName: 'RD Congo' },
  { round: 1, matchNum: 22, homeTeam: 'UZB', awayTeam: 'COL', homeName: 'Uzbequistão', awayName: 'Colômbia' },
  { round: 1, matchNum: 23, homeTeam: 'ING', awayTeam: 'CRO', homeName: 'Inglaterra', awayName: 'Croácia' },
  { round: 1, matchNum: 24, homeTeam: 'GAN', awayTeam: 'PAN', homeName: 'Gana', awayName: 'Panamá' },

  // Round 2 - 2ª Rodada
  { round: 2, matchNum: 1, homeTeam: 'TCH', awayTeam: 'AFS', homeName: 'Tchéquia', awayName: 'África do Sul' },
  { round: 2, matchNum: 2, homeTeam: 'MEX', awayTeam: 'COR', homeName: 'México', awayName: 'Coreia do Sul' },
  { round: 2, matchNum: 3, homeTeam: 'SUI', awayTeam: 'BOS', homeName: 'Suíça', awayName: 'Bósnia' },
  { round: 2, matchNum: 4, homeTeam: 'CAN', awayTeam: 'CAT', homeName: 'Canadá', awayName: 'Catar' },
  { round: 2, matchNum: 5, homeTeam: 'ESC', awayTeam: 'MAR', homeName: 'Escócia', awayName: 'Marrocos' },
  { round: 2, matchNum: 6, homeTeam: 'BRA', awayTeam: 'HAI', homeName: 'Brasil', awayName: 'Haiti' },
  { round: 2, matchNum: 7, homeTeam: 'EUA', awayTeam: 'AUS', homeName: 'Estados Unidos', awayName: 'Austrália' },
  { round: 2, matchNum: 8, homeTeam: 'TUR', awayTeam: 'PAR', homeName: 'Turquia', awayName: 'Paraguai' },
  { round: 2, matchNum: 9, homeTeam: 'ALE', awayTeam: 'CDM', homeName: 'Alemanha', awayName: 'Comores' },
  { round: 2, matchNum: 10, homeTeam: 'EQU', awayTeam: 'CUR', homeName: 'Equador', awayName: 'Curaçao' },
  { round: 2, matchNum: 11, homeTeam: 'HOL', awayTeam: 'SUE', homeName: 'Holanda', awayName: 'Suécia' },
  { round: 2, matchNum: 12, homeTeam: 'TUN', awayTeam: 'JAP', homeName: 'Tunísia', awayName: 'Japão' },
  { round: 2, matchNum: 13, homeTeam: 'BEL', awayTeam: 'IRA', homeName: 'Bélgica', awayName: 'Irã' },
  { round: 2, matchNum: 14, homeTeam: 'NZE', awayTeam: 'EGI', homeName: 'Nova Zelândia', awayName: 'Egito' },
  { round: 2, matchNum: 15, homeTeam: 'ESP', awayTeam: 'SAL', homeName: 'Espanha', awayName: 'El Salvador' },
  { round: 2, matchNum: 16, homeTeam: 'URU', awayTeam: 'CAB', homeName: 'Uruguai', awayName: 'Cabo Verde' },
  { round: 2, matchNum: 17, homeTeam: 'FRA', awayTeam: 'IRQ', homeName: 'França', awayName: 'Iraque' },
  { round: 2, matchNum: 18, homeTeam: 'NOR', awayTeam: 'SEM', homeName: 'Noruega', awayName: 'São Tomé e Príncipe' },
  { round: 2, matchNum: 19, homeTeam: 'ARG', awayTeam: 'AUT', homeName: 'Argentina', awayName: 'Áustria' },
  { round: 2, matchNum: 20, homeTeam: 'JOR', awayTeam: 'AGL', homeName: 'Jordânia', awayName: 'Angola' },
  { round: 2, matchNum: 21, homeTeam: 'POR', awayTeam: 'UZB', homeName: 'Portugal', awayName: 'Uzbequistão' },
  { round: 2, matchNum: 22, homeTeam: 'COL', awayTeam: 'RDC', homeName: 'Colômbia', awayName: 'RD Congo' },
  { round: 2, matchNum: 23, homeTeam: 'ING', awayTeam: 'GAN', homeName: 'Inglaterra', awayName: 'Gana' },
  { round: 2, matchNum: 24, homeTeam: 'PAN', awayTeam: 'CRO', homeName: 'Panamá', awayName: 'Croácia' },

  // Round 3 - 3ª Rodada
  { round: 3, matchNum: 1, homeTeam: 'AFS', awayTeam: 'COR', homeName: 'África do Sul', awayName: 'Coreia do Sul' },
  { round: 3, matchNum: 2, homeTeam: 'TCH', awayTeam: 'MEX', homeName: 'Tchéquia', awayName: 'México' },
  { round: 3, matchNum: 3, homeTeam: 'SUI', awayTeam: 'CAN', homeName: 'Suíça', awayName: 'Canadá' },
  { round: 3, matchNum: 4, homeTeam: 'BOS', awayTeam: 'CAT', homeName: 'Bósnia', awayName: 'Catar' },
  { round: 3, matchNum: 5, homeTeam: 'MAR', awayTeam: 'HAI', homeName: 'Marrocos', awayName: 'Haiti' },
  { round: 3, matchNum: 6, homeTeam: 'BRA', awayTeam: 'ESC', homeName: 'Brasil', awayName: 'Escócia' },
  { round: 3, matchNum: 7, homeTeam: 'TUR', awayTeam: 'EUA', homeName: 'Turquia', awayName: 'Estados Unidos' },
  { round: 3, matchNum: 8, homeTeam: 'PAR', awayTeam: 'AUS', homeName: 'Paraguai', awayName: 'Austrália' },
  { round: 3, matchNum: 9, homeTeam: 'EQU', awayTeam: 'ALE', homeName: 'Equador', awayName: 'Alemanha' },
  { round: 3, matchNum: 10, homeTeam: 'CUR', awayTeam: 'CDM', homeName: 'Curaçao', awayName: 'Comores' },
  { round: 3, matchNum: 11, homeTeam: 'TUN', awayTeam: 'HOL', homeName: 'Tunísia', awayName: 'Holanda' },
  { round: 3, matchNum: 12, homeTeam: 'JAP', awayTeam: 'SUE', homeName: 'Japão', awayName: 'Suécia' },
  { round: 3, matchNum: 13, homeTeam: 'EGI', awayTeam: 'IRA', homeName: 'Egito', awayName: 'Irã' },
  { round: 3, matchNum: 14, homeTeam: 'NZE', awayTeam: 'BEL', homeName: 'Nova Zelândia', awayName: 'Bélgica' },
  { round: 3, matchNum: 15, homeTeam: 'CAB', awayTeam: 'SAL', homeName: 'Cabo Verde', awayName: 'El Salvador' },
  { round: 3, matchNum: 16, homeTeam: 'URU', awayTeam: 'ESP', homeName: 'Uruguai', awayName: 'Espanha' },
  { round: 3, matchNum: 17, homeTeam: 'SEM', awayTeam: 'IRQ', homeName: 'São Tomé e Príncipe', awayName: 'Iraque' },
  { round: 3, matchNum: 18, homeTeam: 'NOR', awayTeam: 'FRA', homeName: 'Noruega', awayName: 'França' },
  { round: 3, matchNum: 19, homeTeam: 'JOR', awayTeam: 'ARG', homeName: 'Jordânia', awayName: 'Argentina' },
  { round: 3, matchNum: 20, homeTeam: 'AGL', awayTeam: 'AUT', homeName: 'Angola', awayName: 'Áustria' },
  { round: 3, matchNum: 21, homeTeam: 'RDC', awayTeam: 'UZB', homeName: 'RD Congo', awayName: 'Uzbequistão' },
  { round: 3, matchNum: 22, homeTeam: 'COL', awayTeam: 'POR', homeName: 'Colômbia', awayName: 'Portugal' },
  { round: 3, matchNum: 23, homeTeam: 'CRO', awayTeam: 'GAN', homeName: 'Croácia', awayName: 'Gana' },
  { round: 3, matchNum: 24, homeTeam: 'PAN', awayTeam: 'ING', homeName: 'Panamá', awayName: 'Inglaterra' },
]

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
