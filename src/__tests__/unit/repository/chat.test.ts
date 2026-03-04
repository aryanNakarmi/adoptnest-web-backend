import { ChatRepository } from '../../../repositories/chat.repository';
import { ChatModel, MessageModel } from '../../../models/chat.model';

jest.mock('../../../models/chat.model');

const mockChat = { _id: 'chat123', userId: 'user123', lastMessage: null, toObject: jest.fn().mockReturnValue({ _id: 'chat123', userId: 'user123' }) };
const mockMsg = { _id: 'msg123', chatId: 'chat123', senderId: 'user123', senderRole: 'user', content: 'Hello', isRead: false, populate: jest.fn() };

describe('ChatRepository - Unit Tests', () => {
  let repo: ChatRepository;
  beforeEach(() => { repo = new ChatRepository(); jest.clearAllMocks(); });

  // getOrCreateChat
  describe('getOrCreateChat', () => {
    it('returns existing chat without creating', async () => {
      (ChatModel.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockChat) });
      expect(await repo.getOrCreateChat('user123')).toEqual(mockChat);
      expect(ChatModel.create).not.toHaveBeenCalled();
    });
    it('creates new chat when not found', async () => {
      (ChatModel.findOne as jest.Mock)
        .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(null) })
        .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue(mockChat) });
      (ChatModel.create as jest.Mock).mockResolvedValue(mockChat);
      expect(await repo.getOrCreateChat('user123')).toEqual(mockChat);
      expect(ChatModel.create).toHaveBeenCalledWith({ userId: 'user123' });
    });
  });

  // getChatByUserId
  describe('getChatByUserId', () => {
    it('returns chat for userId', async () => {
      (ChatModel.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockChat) });
      expect(await repo.getChatByUserId('user123')).toEqual(mockChat);
      expect(ChatModel.findOne).toHaveBeenCalledWith({ userId: 'user123' });
    });
    it('returns null when not found', async () => {
      (ChatModel.findOne as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      expect(await repo.getChatByUserId('user999')).toBeNull();
    });
  });

  // getChatById
  describe('getChatById', () => {
    it('returns chat by id', async () => {
      (ChatModel.findById as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockChat) });
      expect(await repo.getChatById('chat123')).toEqual(mockChat);
    });
    it('returns null when not found', async () => {
      (ChatModel.findById as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      expect(await repo.getChatById('nope')).toBeNull();
    });
  });

  // getAllChats
  describe('getAllChats', () => {
    it('returns chats with unreadCount per chat', async () => {
      (ChatModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockChat]) }) });
      (MessageModel.countDocuments as jest.Mock).mockResolvedValue(3);
      const result = await repo.getAllChats();
      expect(result[0].unreadCount).toBe(3);
      expect(MessageModel.countDocuments).toHaveBeenCalledWith({ chatId: mockChat._id, senderRole: 'user', isRead: false });
    });
    it('returns empty array when no chats', async () => {
      (ChatModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getAllChats()).toEqual([]);
    });
  });

  // updateLastMessage
  describe('updateLastMessage', () => {
    it('updates lastMessage and sets lastMessageAt as Date', async () => {
      (ChatModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockChat);
      await repo.updateLastMessage('chat123', 'Hi!');
      const [id, update] = (ChatModel.findByIdAndUpdate as jest.Mock).mock.calls[0];
      expect(id).toBe('chat123');
      expect(update.lastMessage).toBe('Hi!');
      expect(update.lastMessageAt).toBeInstanceOf(Date);
    });
  });

  // getMessages
  describe('getMessages', () => {
    it('returns messages sorted by createdAt asc', async () => {
      const sortMock = jest.fn().mockResolvedValue([mockMsg]);
      (MessageModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: sortMock }) });
      expect(await repo.getMessages('chat123')).toEqual([mockMsg]);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
    });
    it('returns empty array when no messages', async () => {
      (MessageModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getMessages('chat123')).toEqual([]);
    });
  });

  // createMessage
  describe('createMessage', () => {
    it('creates and populates a message', async () => {
      const populated = { ...mockMsg };
      (MessageModel.create as jest.Mock).mockResolvedValue({ ...mockMsg, populate: jest.fn().mockResolvedValue(populated) });
      const result = await repo.createMessage({ chatId: 'chat123', senderId: 'user123', senderRole: 'user', content: 'Hello' });
      expect(MessageModel.create).toHaveBeenCalledWith({ chatId: 'chat123', senderId: 'user123', senderRole: 'user', content: 'Hello' });
      expect(result).toEqual(populated);
    });
  });

  // markMessagesAsRead - key logic: flips the sender role
  describe('markMessagesAsRead', () => {
    it('marks admin messages read when reader is user', async () => {
      (MessageModel.updateMany as jest.Mock).mockResolvedValue({});
      await repo.markMessagesAsRead('chat123', 'user');
      expect(MessageModel.updateMany).toHaveBeenCalledWith({ chatId: 'chat123', senderRole: 'admin', isRead: false }, { isRead: true });
    });
    it('marks user messages read when reader is admin', async () => {
      (MessageModel.updateMany as jest.Mock).mockResolvedValue({});
      await repo.markMessagesAsRead('chat123', 'admin');
      expect(MessageModel.updateMany).toHaveBeenCalledWith({ chatId: 'chat123', senderRole: 'user', isRead: false }, { isRead: true });
    });
  });

  // getUnreadCount - key logic: flips the sender role
  describe('getUnreadCount', () => {
    it('counts admin-sent unread when reader is user', async () => {
      (MessageModel.countDocuments as jest.Mock).mockResolvedValue(5);
      expect(await repo.getUnreadCount('chat123', 'user')).toBe(5);
      expect(MessageModel.countDocuments).toHaveBeenCalledWith({ chatId: 'chat123', senderRole: 'admin', isRead: false });
    });
    it('counts user-sent unread when reader is admin', async () => {
      (MessageModel.countDocuments as jest.Mock).mockResolvedValue(2);
      expect(await repo.getUnreadCount('chat123', 'admin')).toBe(2);
      expect(MessageModel.countDocuments).toHaveBeenCalledWith({ chatId: 'chat123', senderRole: 'user', isRead: false });
    });
  });
});