"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentId = void 0;
const zod_1 = require("zod");
const value_object_base_1 = require("../base/value-object.base");
const AppointmentIdSchema = zod_1.z.string()
    .uuid('Invalid appointment ID format')
    .brand();
class AppointmentId extends value_object_base_1.Id {
    constructor(value) {
        super(value);
    }
    static create(value) {
        if (value) {
            AppointmentIdSchema.parse(value);
            return new AppointmentId(value);
        }
        return new AppointmentId(value_object_base_1.Id.create().toString());
    }
    static fromString(value) {
        return AppointmentId.create(value);
    }
}
exports.AppointmentId = AppointmentId;
//# sourceMappingURL=appointment-id.vo.js.map