"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApplicationSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    businessName: { type: String, required: true },
    businessType: { type: String, required: true },
    taxId: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String },
    idType: { type: String, enum: ["national_id", "passport"], required: true },
    nidFront: {
        type: String,
        validate: {
            validator: function (value) {
                if (this.idType === "national_id" && !value)
                    return false;
                return true;
            },
            message: "nidFront is required when idType is 'national_id'",
        },
    },
    nidBack: {
        type: String,
        validate: {
            validator: function (value) {
                if (this.idType === "national_id" && !value)
                    return false;
                return true;
            },
            message: "nidBack is required when idType is 'national_id'",
        },
    },
    passport: {
        type: String,
        validate: {
            validator: function (value) {
                if (this.idType === "passport" && !value)
                    return false;
                return true;
            },
            message: "passport file is required when idType is 'passport'",
        },
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    adminNotes: { type: String },
}, { timestamps: true });
exports.Application = mongoose_1.default.model("Application", ApplicationSchema);
