-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."AppointmentType" AS ENUM ('CONSULTATION', 'FOLLOW_UP', 'THERAPY_SESSION', 'ASSESSMENT', 'GROUP_SESSION', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."MeetingType" AS ENUM ('IN_PERSON', 'VIDEO_CALL', 'PHONE_CALL', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateTable
CREATE TABLE "public"."specializations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."psychologists" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "registrationId" VARCHAR(50),
    "biography" TEXT,
    "consultationFeeMin" DECIMAL(10,2),
    "consultationFeeMax" DECIMAL(10,2),
    "yearsExperience" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileImageUrl" TEXT,
    "workingDays" INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "timeSlotDuration" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "psychologists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."psychologist_specializations" (
    "psychologistId" TEXT NOT NULL,
    "specializationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "certifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "psychologist_specializations_pkey" PRIMARY KEY ("psychologistId","specializationId")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "dateOfBirth" TIMESTAMP(3),
    "gender" "public"."Gender",
    "address" TEXT,
    "emergencyContact" VARCHAR(255),
    "emergencyPhone" VARCHAR(20),
    "medicalNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferredLanguage" VARCHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "appointmentType" "public"."AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "meetingType" "public"."MeetingType" NOT NULL DEFAULT 'IN_PERSON',
    "meetingUrl" TEXT,
    "meetingRoom" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "privateNotes" TEXT,
    "consultationFee" DECIMAL(10,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."psychologist_availability" (
    "id" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "psychologist_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_history" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "condition" VARCHAR(255) NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "diagnosedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "tableName" VARCHAR(50) NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateId" VARCHAR(50) NOT NULL,
    "aggregateType" VARCHAR(50) NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "eventData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "status" VARCHAR(20) NOT NULL,
    "error" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specializations_name_key" ON "public"."specializations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_email_key" ON "public"."psychologists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_registrationId_key" ON "public"."psychologists"("registrationId");

-- CreateIndex
CREATE INDEX "psychologists_email_idx" ON "public"."psychologists"("email");

-- CreateIndex
CREATE INDEX "psychologists_registrationId_idx" ON "public"."psychologists"("registrationId");

-- CreateIndex
CREATE INDEX "psychologists_isActive_isVerified_idx" ON "public"."psychologists"("isActive", "isVerified");

-- CreateIndex
CREATE INDEX "psychologists_createdAt_idx" ON "public"."psychologists"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "public"."patients"("email");

-- CreateIndex
CREATE INDEX "patients_email_idx" ON "public"."patients"("email");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "public"."patients"("phone");

-- CreateIndex
CREATE INDEX "patients_isActive_idx" ON "public"."patients"("isActive");

-- CreateIndex
CREATE INDEX "patients_createdAt_idx" ON "public"."patients"("createdAt");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "public"."appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_psychologistId_idx" ON "public"."appointments"("psychologistId");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "public"."appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "public"."appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_createdAt_idx" ON "public"."appointments"("createdAt");

-- CreateIndex
CREATE INDEX "appointments_appointmentType_idx" ON "public"."appointments"("appointmentType");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_psychologistId_scheduledAt_key" ON "public"."appointments"("psychologistId", "scheduledAt");

-- CreateIndex
CREATE INDEX "psychologist_availability_psychologistId_date_idx" ON "public"."psychologist_availability"("psychologistId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "psychologist_availability_psychologistId_date_key" ON "public"."psychologist_availability"("psychologistId", "date");

-- CreateIndex
CREATE INDEX "medical_history_patientId_idx" ON "public"."medical_history"("patientId");

-- CreateIndex
CREATE INDEX "reviews_psychologistId_idx" ON "public"."reviews"("psychologistId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "public"."reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "public"."reviews"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_patientId_psychologistId_key" ON "public"."reviews"("patientId", "psychologistId");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "public"."audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "outbox_events_status_retryCount_idx" ON "public"."outbox_events"("status", "retryCount");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateId_idx" ON "public"."outbox_events"("aggregateId");

-- CreateIndex
CREATE INDEX "outbox_events_createdAt_idx" ON "public"."outbox_events"("createdAt");

-- CreateIndex
CREATE INDEX "outbox_events_eventType_idx" ON "public"."outbox_events"("eventType");

-- AddForeignKey
ALTER TABLE "public"."psychologist_specializations" ADD CONSTRAINT "psychologist_specializations_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "public"."psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."psychologist_specializations" ADD CONSTRAINT "psychologist_specializations_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES "public"."specializations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "public"."psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."psychologist_availability" ADD CONSTRAINT "psychologist_availability_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "public"."psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_history" ADD CONSTRAINT "medical_history_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "public"."psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
