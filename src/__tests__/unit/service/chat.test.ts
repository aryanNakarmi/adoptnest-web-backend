import { ChatService } from '../../../services/chat.service';
import { ChatRepository } from '../../../repositories/chat.repository';

jest.mock('../../../repositories/chat.repository');

const mockChat = { _id: 'chat123', userId: 'user123', lastMessage: null, lastMessageAt: null };
const mockMessage = { _id: 'msg123', chatId: 'chat123', senderId: 'user123', senderRole: 'user', content: 'Hello!', isRead: false };

// The repository is instantiated at module level (outside the class) in chat.service.ts,
// so we spy on the prototype instead of using mock.instances[0].
const proto = ChatRepository.prototype;

describe('ChatService - Unit Tests', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
    jest.clearAllMocks();
  });

  describe('getOrCreateChat', () => {
    it('returns existing chat when one already exists for the user', async () => {
      jest.spyOn(proto, 'getOrCreateChat').mockResolvedValue(mockChat as any);
      expect(await service.getOrCreateChat('user123')).toEqual(mockChat);
      expect(proto.getOrCreateChat).toHaveBeenCalledWith('user123');
    });
    it('creates and returns a new chat when none exists', async () => {
      const newChat = { ...mockChat, _id: 'newchat' };
      jest.spyOn(proto, 'getOrCreateChat').mockResolvedValue(newChat as any);
      expect(await service.getOrCreateChat('user999')).toEqual(newChat);
    });
    it('propagates repository errors', async () => {
      jest.spyOn(proto, 'getOrCreateChat').mockRejectedValue(new Error('DB error'));
      await expect(service.getOrCreateChat('user123')).rejects.toThrow('DB error');
    });
  });

  describe('getChatByUserId', () => {
    it('returns chat for the given userId', async () => {
      jest.spyOn(proto, 'getChatByUserId').mockResolvedValue(mockChat as any);
      expect(await service.getChatByUserId('user123')).toEqual(mockChat);
      expect(proto.getChatByUserId).toHaveBeenCalledWith('user123');
    });
    it('returns null when no chat exists for the user', async () => {
      jest.spyOn(proto, 'getChatByUserId').mockResolvedValue(null);
      expect(await service.getChatByUserId('user999')).toBeNull();
    });
  });

  describe('getChatById', () => {
    it('returns chat by chatId', async () => {
      jest.spyOn(proto, 'getChatById').mockResolvedValue(mockChat as any);
      expect(await service.getChatById('chat123')).toEqual(mockChat);
      expect(proto.getChatById).toHaveBeenCalledWith('chat123');
    });
    it('returns null when chatId not found', async () => {
      jest.spyOn(proto, 'getChatById').mockResolvedValue(null);
      expect(await service.getChatById('nope')).toBeNull();
    });
  });

  describe('getAllChats', () => {
    it('returns all chats from the repository', async () => {
      jest.spyOn(proto, 'getAllChats').mockResolvedValue([mockChat] as any);
      expect(await service.getAllChats()).toEqual([mockChat]);
      expect(proto.getAllChats).toHaveBeenCalledTimes(1);
    });
    it('returns empty array when no chats exist', async () => {
      jest.spyOn(proto, 'getAllChats').mockResolvedValue([]);
      expect(await service.getAllChats()).toEqual([]);
    });
  });

  describe('getMessages', () => {
    it('returns messages for the given chatId', async () => {
      jest.spyOn(proto, 'getMessages').mockResolvedValue([mockMessage] as any);
      expect(await service.getMessages('chat123')).toEqual([mockMessage]);
      expect(proto.getMessages).toHaveBeenCalledWith('chat123');
    });
    it('returns empty array when chat has no messages', async () => {
      jest.spyOn(proto, 'getMessages').mockResolvedValue([]);
      expect(await service.getMessages('chat123')).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    const sendData = { chatId: 'chat123', senderId: 'user123', senderRole: 'user' as const, content: 'Hello!' };

    it('creates the message and returns it', async () => {
      jest.spyOn(proto, 'createMessage').mockResolvedValue(mockMessage as any);
      jest.spyOn(proto, 'updateLastMessage').mockResolvedValue(undefined as any);
      expect(await service.sendMessage(sendData)).toEqual(mockMessage);
    });

    it('calls createMessage with the full message payload', async () => {
      jest.spyOn(proto, 'createMessage').mockResolvedValue(mockMessage as any);
      jest.spyOn(proto, 'updateLastMessage').mockResolvedValue(undefined as any);
      await service.sendMessage(sendData);
      expect(proto.createMessage).toHaveBeenCalledWith(sendData);
    });

    it('calls updateLastMessage with chatId and content after saving message', async () => {
      jest.spyOn(proto, 'createMessage').mockResolvedValue(mockMessage as any);
      jest.spyOn(proto, 'updateLastMessage').mockResolvedValue(undefined as any);
      await service.sendMessage(sendData);
      expect(proto.updateLastMessage).toHaveBeenCalledWith('chat123', 'Hello!');
    });

    it('calls updateLastMessage AFTER createMessage (order matters)', async () => {
      const callOrder: string[] = [];
      jest.spyOn(proto, 'createMessage').mockImplementation(async () => { callOrder.push('createMessage'); return mockMessage as any; });
      jest.spyOn(proto, 'updateLastMessage').mockImplementation(async () => { callOrder.push('updateLastMessage'); return undefined as any; });
      await service.sendMessage(sendData);
      expect(callOrder).toEqual(['createMessage', 'updateLastMessage']);
    });

    it('works when senderRole is admin', async () => {
      const adminData = { ...sendData, senderId: 'admin1', senderRole: 'admin' as const };
      jest.spyOn(proto, 'createMessage').mockResolvedValue({ ...mockMessage, senderRole: 'admin' } as any);
      jest.spyOn(proto, 'updateLastMessage').mockResolvedValue(undefined as any);
      await service.sendMessage(adminData);
      expect(proto.createMessage).toHaveBeenCalledWith(adminData);
      expect(proto.updateLastMessage).toHaveBeenCalledWith('chat123', 'Hello!');
    });

    it('does NOT call updateLastMessage when createMessage fails', async () => {
      jest.spyOn(proto, 'createMessage').mockRejectedValue(new Error('Insert failed'));
      jest.spyOn(proto, 'updateLastMessage').mockResolvedValue(undefined as any);
      await expect(service.sendMessage(sendData)).rejects.toThrow('Insert failed');
      expect(proto.updateLastMessage).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('delegates to markMessagesAsRead with correct args for user', async () => {
      jest.spyOn(proto, 'markMessagesAsRead').mockResolvedValue(undefined as any);
      await service.markAsRead('chat123', 'user');
      expect(proto.markMessagesAsRead).toHaveBeenCalledWith('chat123', 'user');
    });
    it('delegates to markMessagesAsRead with correct args for admin', async () => {
      jest.spyOn(proto, 'markMessagesAsRead').mockResolvedValue(undefined as any);
      await service.markAsRead('chat123', 'admin');
      expect(proto.markMessagesAsRead).toHaveBeenCalledWith('chat123', 'admin');
    });
    it('propagates repository errors', async () => {
      jest.spyOn(proto, 'markMessagesAsRead').mockRejectedValue(new Error('DB error'));
      await expect(service.markAsRead('chat123', 'user')).rejects.toThrow('DB error');
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count for user reader', async () => {
      jest.spyOn(proto, 'getUnreadCount').mockResolvedValue(4);
      expect(await service.getUnreadCount('chat123', 'user')).toBe(4);
      expect(proto.getUnreadCount).toHaveBeenCalledWith('chat123', 'user');
    });
    it('returns unread count for admin reader', async () => {
      jest.spyOn(proto, 'getUnreadCount').mockResolvedValue(7);
      expect(await service.getUnreadCount('chat123', 'admin')).toBe(7);
      expect(proto.getUnreadCount).toHaveBeenCalledWith('chat123', 'admin');
    });
    it('returns 0 when no unread messages', async () => {
      jest.spyOn(proto, 'getUnreadCount').mockResolvedValue(0);
      expect(await service.getUnreadCount('chat123', 'user')).toBe(0);
    });
    it('propagates repository errors', async () => {
      jest.spyOn(proto, 'getUnreadCount').mockRejectedValue(new Error('DB error'));
      await expect(service.getUnreadCount('chat123', 'user')).rejects.toThrow('DB error');
    });
  });
});