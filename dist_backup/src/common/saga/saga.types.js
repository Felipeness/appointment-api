"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaStatus = void 0;
var SagaStatus;
(function (SagaStatus) {
    SagaStatus["PENDING"] = "PENDING";
    SagaStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SagaStatus["COMPLETED"] = "COMPLETED";
    SagaStatus["COMPENSATING"] = "COMPENSATING";
    SagaStatus["COMPENSATED"] = "COMPENSATED";
    SagaStatus["FAILED"] = "FAILED";
})(SagaStatus || (exports.SagaStatus = SagaStatus = {}));
//# sourceMappingURL=saga.types.js.map