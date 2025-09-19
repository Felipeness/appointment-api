"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patient = void 0;
class Patient {
    id;
    email;
    name;
    phone;
    dateOfBirth;
    gender;
    address;
    emergencyContact;
    emergencyPhone;
    medicalNotes;
    preferredLanguage;
    isActive;
    createdAt;
    updatedAt;
    lastActiveAt;
    constructor(id, email, name, phone, dateOfBirth, gender, address, emergencyContact, emergencyPhone, medicalNotes, preferredLanguage, isActive = true, createdAt = new Date(), updatedAt = new Date(), lastActiveAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
        this.medicalNotes = medicalNotes;
        this.preferredLanguage = preferredLanguage;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastActiveAt = lastActiveAt;
        this.validate();
    }
    validate() {
        if (!this.id) {
            throw new Error('Patient ID is required');
        }
        if (!this.email || !this.isValidEmail(this.email)) {
            throw new Error('Valid email is required');
        }
        if (!this.name || this.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    deactivate() {
        return new Patient(this.id, this.email, this.name, this.phone, this.dateOfBirth, this.gender, this.address, this.emergencyContact, this.emergencyPhone, this.medicalNotes, this.preferredLanguage, false, this.createdAt, new Date(), this.lastActiveAt);
    }
    updateContactInfo(email, phone, address) {
        return new Patient(this.id, email || this.email, this.name, phone !== undefined ? phone : this.phone, this.dateOfBirth, this.gender, address !== undefined ? address : this.address, this.emergencyContact, this.emergencyPhone, this.medicalNotes, this.preferredLanguage, this.isActive, this.createdAt, new Date(), new Date());
    }
    updateMedicalInfo(dateOfBirth, gender, emergencyContact, emergencyPhone, medicalNotes) {
        return new Patient(this.id, this.email, this.name, this.phone, dateOfBirth !== undefined ? dateOfBirth : this.dateOfBirth, gender !== undefined ? gender : this.gender, this.address, emergencyContact !== undefined ? emergencyContact : this.emergencyContact, emergencyPhone !== undefined ? emergencyPhone : this.emergencyPhone, medicalNotes !== undefined ? medicalNotes : this.medicalNotes, this.preferredLanguage, this.isActive, this.createdAt, new Date(), new Date());
    }
}
exports.Patient = Patient;
//# sourceMappingURL=patient.entity.js.map