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
exports.Order = exports.Counter = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Counter schema to track order numbers per seller
const CounterSchema = new mongoose_1.Schema({
    seller: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", unique: true },
    seq: { type: Number, default: 0 },
});
exports.Counter = mongoose_1.default.model("Counter", CounterSchema);
// Order schema
const OrderSchema = new mongoose_1.Schema({
    orderNumber: { type: Number },
    seller: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
        {
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            title: { type: String, required: true },
            currency: { type: String, default: "USD" },
            shippingCost: { type: Number, default: 0 },
        },
    ],
    subtotal: { type: Number, required: true },
    totalShippingCost: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ["processing", "delivered", "on-hold", "canceled", "completed"],
        default: "processing",
    },
    shippingAddress: { type: String, required: true },
    date: { type: Date, default: Date.now },
    phone: { type: String },
    paymentMethod: { type: String, default: "cod" },
    currency: { type: String, default: "USD" },
    timeline: [
        {
            status: {
                type: String,
                enum: ["processing", "delivered", "on-hold", "canceled", "completed"],
                required: true,
            },
            timestamp: { type: Date, default: Date.now },
            note: { type: String },
            updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
        },
    ],
}, { timestamps: true });
// Pre-save hook for order number assignment and timeline initialization
OrderSchema.pre("save", async function (next) {
    if (this.isNew) {
        const counter = await exports.Counter.findOneAndUpdate({ seller: this.seller }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        this.orderNumber = counter.seq;
        // Initialize timeline if empty
        if (!this.timeline || this.timeline.length === 0) {
            this.timeline = [
                {
                    status: this.status,
                    timestamp: new Date(),
                    note: "Order created",
                },
            ];
        }
    }
    next();
});
exports.Order = mongoose_1.default.model("Order", OrderSchema);
