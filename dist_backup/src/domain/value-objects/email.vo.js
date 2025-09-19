"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const zod_1 = require("zod");
const value_object_base_1 = require("../base/value-object.base");
const EmailSchema = zod_1.z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(254, 'Email is too long')
    .transform(val => val.toLowerCase().trim());
class Email extends value_object_base_1.ValueObject {
    constructor(value) {
        super(value);
    }
    static create(email) {
        const validatedEmail = EmailSchema.parse(email);
        return new Email(validatedEmail);
    }
    getValue() {
        return this.props;
    }
    toString() {
        return this.props;
    }
    getDomain() {
        return this.props.split('@')[1];
    }
    getLocalPart() {
        return this.props.split('@')[0];
    }
}
exports.Email = Email;
//# sourceMappingURL=email.vo.js.map