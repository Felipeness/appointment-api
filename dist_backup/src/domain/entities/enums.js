"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gender = exports.MeetingType = exports.AppointmentType = exports.AppointmentStatus = void 0;
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["DECLINED"] = "DECLINED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
    AppointmentStatus["RESCHEDULED"] = "RESCHEDULED";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["CONSULTATION"] = "CONSULTATION";
    AppointmentType["FOLLOW_UP"] = "FOLLOW_UP";
    AppointmentType["THERAPY_SESSION"] = "THERAPY_SESSION";
    AppointmentType["ASSESSMENT"] = "ASSESSMENT";
    AppointmentType["GROUP_SESSION"] = "GROUP_SESSION";
    AppointmentType["EMERGENCY"] = "EMERGENCY";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var MeetingType;
(function (MeetingType) {
    MeetingType["IN_PERSON"] = "IN_PERSON";
    MeetingType["ONLINE"] = "ONLINE";
    MeetingType["VIDEO_CALL"] = "VIDEO_CALL";
    MeetingType["PHONE_CALL"] = "PHONE_CALL";
    MeetingType["HYBRID"] = "HYBRID";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
    Gender["NON_BINARY"] = "NON_BINARY";
    Gender["PREFER_NOT_TO_SAY"] = "PREFER_NOT_TO_SAY";
})(Gender || (exports.Gender = Gender = {}));
//# sourceMappingURL=enums.js.map