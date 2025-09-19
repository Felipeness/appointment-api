"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psychologist = void 0;
class Psychologist {
    id;
    email;
    name;
    workingHours;
    phone;
    registrationId;
    biography;
    consultationFeeMin;
    consultationFeeMax;
    yearsExperience;
    profileImageUrl;
    timeSlotDuration;
    isActive;
    isVerified;
    createdAt;
    updatedAt;
    createdBy;
    lastLoginAt;
    constructor(id, email, name, workingHours, phone, registrationId, biography, consultationFeeMin, consultationFeeMax, yearsExperience, profileImageUrl, timeSlotDuration = 60, isActive = true, isVerified = false, createdAt = new Date(), updatedAt = new Date(), createdBy, lastLoginAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.workingHours = workingHours;
        this.phone = phone;
        this.registrationId = registrationId;
        this.biography = biography;
        this.consultationFeeMin = consultationFeeMin;
        this.consultationFeeMax = consultationFeeMax;
        this.yearsExperience = yearsExperience;
        this.profileImageUrl = profileImageUrl;
        this.timeSlotDuration = timeSlotDuration;
        this.isActive = isActive;
        this.isVerified = isVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
        this.lastLoginAt = lastLoginAt;
        this.validate();
    }
    validate() {
        if (!this.id) {
            throw new Error('Psychologist ID is required');
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
    isAvailableAt(dateTime) {
        if (!this.isActive) {
            return false;
        }
        return this.workingHours.isAvailableAt(dateTime);
    }
    updateWorkingHours(workingHours) {
        return new Psychologist(this.id, this.email, this.name, workingHours, this.phone, this.registrationId, this.biography, this.consultationFeeMin, this.consultationFeeMax, this.yearsExperience, this.profileImageUrl, this.timeSlotDuration, this.isActive, this.isVerified, this.createdAt, new Date(), this.createdBy, this.lastLoginAt);
    }
    deactivate() {
        return new Psychologist(this.id, this.email, this.name, this.workingHours, this.phone, this.registrationId, this.biography, this.consultationFeeMin, this.consultationFeeMax, this.yearsExperience, this.profileImageUrl, this.timeSlotDuration, false, this.isVerified, this.createdAt, new Date(), this.createdBy, this.lastLoginAt);
    }
    verify() {
        return new Psychologist(this.id, this.email, this.name, this.workingHours, this.phone, this.registrationId, this.biography, this.consultationFeeMin, this.consultationFeeMax, this.yearsExperience, this.profileImageUrl, this.timeSlotDuration, this.isActive, true, this.createdAt, new Date(), this.createdBy, this.lastLoginAt);
    }
    updateProfile(name, phone, biography, profileImageUrl) {
        return new Psychologist(this.id, this.email, name || this.name, this.workingHours, phone !== undefined ? phone : this.phone, this.registrationId, biography !== undefined ? biography : this.biography, this.consultationFeeMin, this.consultationFeeMax, this.yearsExperience, profileImageUrl !== undefined ? profileImageUrl : this.profileImageUrl, this.timeSlotDuration, this.isActive, this.isVerified, this.createdAt, new Date(), this.createdBy, new Date());
    }
}
exports.Psychologist = Psychologist;
//# sourceMappingURL=psychologist.entity.js.map