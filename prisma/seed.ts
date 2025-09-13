import { PrismaClient, Gender, AppointmentStatus, AppointmentType, MeetingType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const psychologist1 = await prisma.psychologist.upsert({
    where: { email: 'dr.smith@psiclinic.com' },
    update: {},
    create: {
      email: 'dr.smith@psiclinic.com',
      name: 'Dr. Maria Silva',
      phone: '+55 11 99999-0001',
      registrationId: 'CRP 06/12345',
      biography: 'Especialista em Terapia Cognitivo-Comportamental com 15 anos de experiência.',
      consultationFeeMin: 120.00,
      consultationFeeMax: 180.00,
      yearsExperience: 15,
      profileImageUrl: 'https://example.com/profiles/maria-silva.jpg',
      timeSlotDuration: 60,
      isActive: true,
      isVerified: true,
      workingDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00',
    },
  });

  const psychologist2 = await prisma.psychologist.upsert({
    where: { email: 'dr.johnson@psiclinic.com' },
    update: {},
    create: {
      email: 'dr.johnson@psiclinic.com',
      name: 'Dr. João Santos',
      phone: '+55 11 99999-0002',
      registrationId: 'CRP 06/54321',
      biography: 'Psicólogo clínico especializado em terapia familiar e de casal.',
      consultationFeeMin: 100.00,
      consultationFeeMax: 150.00,
      yearsExperience: 8,
      profileImageUrl: 'https://example.com/profiles/joao-santos.jpg',
      timeSlotDuration: 50,
      isActive: true,
      isVerified: true,
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  const psychologist3 = await prisma.psychologist.upsert({
    where: { email: 'dr.brown@psiclinic.com' },
    update: {},
    create: {
      email: 'dr.brown@psiclinic.com',
      name: 'Dra. Ana Costa',
      phone: '+55 11 99999-0003',
      registrationId: 'CRP 06/98765',
      biography: 'Psicóloga especializada em transtornos de ansiedade e depressão.',
      consultationFeeMin: 150.00,
      consultationFeeMax: 220.00,
      yearsExperience: 12,
      profileImageUrl: 'https://example.com/profiles/ana-costa.jpg',
      timeSlotDuration: 60,
      isActive: true,
      isVerified: true,
      workingDays: [2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '19:00',
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      name: 'Carlos Silva',
      phone: '+55 11 88888-0001',
      dateOfBirth: new Date('1985-03-15'),
      gender: Gender.MALE,
      address: 'Rua das Flores, 123 - São Paulo, SP',
      emergencyContact: 'Maria Silva',
      emergencyPhone: '+55 11 77777-0001',
      medicalNotes: 'Histórico de ansiedade. Sem alergias conhecidas.',
      preferredLanguage: 'Português',
      isActive: true,
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      name: 'Fernanda Oliveira',
      phone: '+55 11 88888-0002',
      dateOfBirth: new Date('1992-07-22'),
      gender: Gender.FEMALE,
      address: 'Av. Paulista, 456 - São Paulo, SP',
      emergencyContact: 'Roberto Oliveira',
      emergencyPhone: '+55 11 77777-0002',
      medicalNotes: 'Primeira consulta. Interesse em terapia de casal.',
      preferredLanguage: 'Português',
      isActive: true,
    },
  });

  // Create specializations
  const specialization1 = await prisma.specialization.upsert({
    where: { name: 'Terapia Cognitivo-Comportamental' },
    update: {},
    create: {
      name: 'Terapia Cognitivo-Comportamental',
      description: 'Abordagem terapêutica focada na modificação de padrões de pensamento e comportamento.',
    },
  });

  const specialization2 = await prisma.specialization.upsert({
    where: { name: 'Terapia Familiar' },
    update: {},
    create: {
      name: 'Terapia Familiar',
      description: 'Terapia voltada para conflitos e dinâmicas familiares.',
    },
  });

  const specialization3 = await prisma.specialization.upsert({
    where: { name: 'Transtornos de Ansiedade' },
    update: {},
    create: {
      name: 'Transtornos de Ansiedade',
      description: 'Especialização no tratamento de diversos tipos de ansiedade.',
    },
  });

  // Link psychologists to specializations
  await prisma.psychologistSpecialization.createMany({
    data: [
      { psychologistId: psychologist1.id, specializationId: specialization1.id },
      { psychologistId: psychologist1.id, specializationId: specialization3.id },
      { psychologistId: psychologist2.id, specializationId: specialization2.id },
      { psychologistId: psychologist3.id, specializationId: specialization3.id },
    ],
    skipDuplicates: true,
  });

  // Create medical history records
  const existingMedHistory = await prisma.medicalHistory.findFirst({
    where: {
      patientId: patient1.id,
      condition: 'Transtorno de Ansiedade Generalizada',
    },
  });

  if (!existingMedHistory) {
    await prisma.medicalHistory.create({
      data: {
        patientId: patient1.id,
        condition: 'Transtorno de Ansiedade Generalizada',
        diagnosis: 'TAG - Diagnóstico confirmado através de avaliação clínica',
        treatment: 'Terapia cognitivo-comportamental por 6 meses. Melhora significativa dos sintomas.',
        medications: 'Sertralina 50mg - 1x ao dia',
        allergies: 'Nenhuma alergia conhecida',
      },
    });
  }

  // Create sample appointments
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
  futureDate.setHours(10, 0, 0, 0);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient1.id,
      psychologistId: psychologist1.id,
      scheduledAt: futureDate,
    },
  });

  if (!existingAppointment) {
    await prisma.appointment.create({
      data: {
        patientId: patient1.id,
        psychologistId: psychologist1.id,
        scheduledAt: futureDate,
        duration: 60,
        appointmentType: AppointmentType.THERAPY_SESSION,
        status: AppointmentStatus.CONFIRMED,
        meetingType: MeetingType.IN_PERSON,
        meetingRoom: 'Sala 301',
        reason: 'Sessão de acompanhamento - TAG',
        consultationFee: 150.00,
        isPaid: false,
        confirmedAt: new Date(),
      },
    });
  }

  console.log('✅ Seed data created successfully');
  console.log('👩‍⚕️ Created psychologists:', {
    psychologist1: psychologist1.name,
    psychologist2: psychologist2.name,
    psychologist3: psychologist3.name,
  });
  console.log('👤 Created patients:', {
    patient1: patient1.name,
    patient2: patient2.name,
  });
  console.log('🔬 Created specializations:', {
    specialization1: specialization1.name,
    specialization2: specialization2.name,
    specialization3: specialization3.name,
  });
  console.log('📅 Created sample appointment for:', patient1.name);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });