"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const message_controller_1 = require("../../controller/messages/message.controller");
const router = express_1.default.Router();
router.get("/:conversationId", message_controller_1.getMessages); // get messages in a conversation
exports.default = router;
