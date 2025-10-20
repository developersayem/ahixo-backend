import express from "express";
import { getMessages } from "../../controller/messages/message.controller";

const router = express.Router();

router.get("/:conversationId", getMessages); // get messages in a conversation

export default router;
