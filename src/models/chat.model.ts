import mongoose, { Document, Schema } from "mongoose";

// ===================== CHAT MODEL =====================
export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ChatModel = mongoose.model<IChat>("Chat", ChatSchema);

// ===================== MESSAGE MODEL =====================
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: "user" | "admin";
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
