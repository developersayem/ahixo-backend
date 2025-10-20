import express from "express";
import { getUserConversations } from "../../controller/messages/conversation.controller";

const router = express.Router();

router.get("/:userId", getUserConversations);

export default router;
