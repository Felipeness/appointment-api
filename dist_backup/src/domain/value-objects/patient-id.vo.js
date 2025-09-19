"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientId = void 0;
const zod_1 = require("zod");
const value_object_base_1 = require("../base/value-object.base");
const PatientIdSchema = zod_1.z.string()
    .uuid('Invalid patient ID format')
    .brand();
class PatientId extends value_object_base_1.Id {
    constructor(value) {
        super(value);
    }
    static create(value) {
        if (value) {
            PatientIdSchema.parse(value);
            return new PatientId(value);
        }
        return new PatientId(value_object_base_1.Id.create().toString());
    }
    static fromString(value) {
        return PatientId.create(value);
    }
}
exports.PatientId = PatientId;
//# sourceMappingURL=patient-id.vo.js.map