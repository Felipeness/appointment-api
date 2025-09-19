"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsychologistId = void 0;
const zod_1 = require("zod");
const value_object_base_1 = require("../base/value-object.base");
const PsychologistIdSchema = zod_1.z.string()
    .uuid('Invalid psychologist ID format')
    .brand();
class PsychologistId extends value_object_base_1.Id {
    constructor(value) {
        super(value);
    }
    static create(value) {
        if (value) {
            PsychologistIdSchema.parse(value);
            return new PsychologistId(value);
        }
        return new PsychologistId(value_object_base_1.Id.create().toString());
    }
    static fromString(value) {
        return PsychologistId.create(value);
    }
}
exports.PsychologistId = PsychologistId;
//# sourceMappingURL=psychologist-id.vo.js.map