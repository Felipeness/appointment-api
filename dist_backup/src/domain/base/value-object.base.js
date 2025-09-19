"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Id = exports.IdSchema = exports.ValueObject = void 0;
const zod_1 = require("zod");
class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.props === undefined) {
            return false;
        }
        return JSON.stringify(this.props) === JSON.stringify(vo.props);
    }
    getValue() {
        return this.props;
    }
}
exports.ValueObject = ValueObject;
exports.IdSchema = zod_1.z.string().uuid('Invalid ID format');
class Id extends ValueObject {
    constructor(value) {
        exports.IdSchema.parse(value);
        super(value);
    }
    toString() {
        return this.props;
    }
    static create(value) {
        if (value) {
            return new Id(value);
        }
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return new Id(uuid);
    }
}
exports.Id = Id;
//# sourceMappingURL=value-object.base.js.map