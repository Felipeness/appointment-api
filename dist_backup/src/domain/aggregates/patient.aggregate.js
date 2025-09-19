"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = void 0;
const zod_1 = require("zod");
const aggregate_root_base_1 = require("../base/aggregate-root.base");
const patient_id_vo_1 = require("../value-objects/patient-id.vo");
const date_service_1 = require("../services/date.service");
const enums_1 = require("../entities/enums");
const PatientPropsSchema = zod_1.z.object({
    id: zod_1.z.any(),
    email: zod_1.z.any(),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    phone: zod_1.z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional(),
    dateOfBirth: zod_1.z.date().max(new Date(), 'Date of birth cannot be in the future').optional(),
    gender: zod_1.z.nativeEnum(enums_1.Gender).optional(),
    address: zod_1.z.string().max(500, 'Address is too long').optional(),
    emergencyContact: zod_1.z.string().max(100, 'Emergency contact name is too long').optional(),
    emergencyPhone: zod_1.z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid emergency phone format').optional(),
    medicalNotes: zod_1.z.string().max(1000, 'Medical notes are too long').optional(),
    preferredLanguage: zod_1.z.string().max(50, 'Preferred language is too long').optional(),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
    lastActiveAt: zod_1.z.date().optional(),
});
class Patient extends aggregate_root_base_1.AggregateRoot {
    constructor(props, version) {
        super(props, props.id.toString(), version);
    }
    static create(props) {
        const patientProps = {
            ...props,
            id: patient_id_vo_1.PatientId.create(),
            createdAt: date_service_1.DateService.now(),
            updatedAt: date_service_1.DateService.now(),
        };
        const validatedProps = PatientPropsSchema.parse(patientProps);
        return new Patient(validatedProps);
    }
    static reconstitute(props, version) {
        return new Patient(props, version);
    }
    get patientId() {
        return this.props.id;
    }
    get email() {
        return this.props.email;
    }
    get name() {
        return this.props.name;
    }
    get isActive() {
        return this.props.isActive;
    }
    deactivate() {
        if (!this.props.isActive) {
            throw new Error('Patient is already inactive');
        }
        this.props.isActive = false;
        this.props.updatedAt = date_service_1.DateService.now();
    }
    activate() {
        if (this.props.isActive) {
            throw new Error('Patient is already active');
        }
        this.props.isActive = true;
        this.props.updatedAt = date_service_1.DateService.now();
    }
    updateContactInfo(email, phone, address) {
        if (email) {
            this.props.email = email;
        }
        if (phone !== undefined) {
            if (phone && !PatientPropsSchema.shape.phone.safeParse(phone).success) {
                throw new Error('Invalid phone format');
            }
            this.props.phone = phone || undefined;
        }
        if (address !== undefined) {
            if (address && address.length > 500) {
                throw new Error('Address is too long');
            }
            this.props.address = address || undefined;
        }
        this.props.updatedAt = date_service_1.DateService.now();
        this.props.lastActiveAt = date_service_1.DateService.now();
    }
    updateMedicalInfo(dateOfBirth, gender, emergencyContact, emergencyPhone, medicalNotes) {
        if (dateOfBirth !== undefined) {
            if (dateOfBirth && dateOfBirth > new Date()) {
                throw new Error('Date of birth cannot be in the future');
            }
            this.props.dateOfBirth = dateOfBirth || undefined;
        }
        if (gender !== undefined) {
            this.props.gender = gender || undefined;
        }
        if (emergencyContact !== undefined) {
            if (emergencyContact && emergencyContact.length > 100) {
                throw new Error('Emergency contact name is too long');
            }
            this.props.emergencyContact = emergencyContact || undefined;
        }
        if (emergencyPhone !== undefined) {
            if (emergencyPhone && !PatientPropsSchema.shape.emergencyPhone.safeParse(emergencyPhone).success) {
                throw new Error('Invalid emergency phone format');
            }
            this.props.emergencyPhone = emergencyPhone || undefined;
        }
        if (medicalNotes !== undefined) {
            if (medicalNotes && medicalNotes.length > 1000) {
                throw new Error('Medical notes are too long');
            }
            this.props.medicalNotes = medicalNotes || undefined;
        }
        this.props.updatedAt = date_service_1.DateService.now();
        this.props.lastActiveAt = date_service_1.DateService.now();
    }
    calculateAge() {
        if (!this.props.dateOfBirth) {
            return null;
        }
        const today = date_service_1.DateService.now();
        const birthDate = this.props.dateOfBirth;
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    toSnapshot() {
        return { ...this.props };
    }
}
exports.Patient = Patient;
//# sourceMappingURL=patient.aggregate.js.map