const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Create a test psychologist
  const psychologist = await prisma.psychologist.upsert({
    where: { id: 'psych-001' },
    update: {},
    create: {
      id: 'psych-001',
      name: 'Dr. Ana Silva',
      email: 'ana@psi.com',
      phone: '11987654321',
      registrationId: 'CRP-12345',
      consultationFeeMin: 150.00,
      consultationFeeMax: 150.00,
      isActive: true,
      workingDays: [1,2,3,4,5],
      startTime: '09:00',
      endTime: '18:00'
    }
  })
  
  console.log('✅ Created psychologist:', psychologist.name)
  
  // Create a test patient 
  const patient = await prisma.patient.upsert({
    where: { email: 'joao@teste.com' },
    update: {},
    create: {
      email: 'joao@teste.com',
      name: 'João Silva',
      phone: '11999999999',
      isActive: true
    }
  })
  
  console.log('✅ Created patient:', patient.name)
  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
