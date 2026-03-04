import { UserRepository } from '../../../repositories/user.repository';
import { UserModel } from '../../../models/user.model';

jest.mock('../../../models/user.model');

const mockUser = {
  _id: 'user123',
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'hashedpassword',
  phoneNumber: '1234567890',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserRepository - Unit Tests', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
    jest.clearAllMocks();
  });

  // ─── createUser ──────────────────────────────────────────────
  describe('createUser', () => {
    it('should create and save a new user', async () => {
      const saveMock = jest.fn().mockResolvedValue(mockUser);
      (UserModel as any).mockImplementation(() => ({ save: saveMock }));

      const result = await repo.createUser({ fullName: 'John Doe', email: 'john@example.com', password: 'pass' });
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw if save fails due to duplicate email', async () => {
      const saveMock = jest.fn().mockRejectedValue(new Error('Duplicate key error'));
      (UserModel as any).mockImplementation(() => ({ save: saveMock }));

      await expect(repo.createUser({ email: 'john@example.com' })).rejects.toThrow('Duplicate key error');
    });
  });

  // ─── getUserByEmail ───────────────────────────────────────────
  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      const result = await repo.getUserByEmail('john@example.com');
      expect(result).toEqual(mockUser);
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should return null when email not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      const result = await repo.getUserByEmail('ghost@example.com');
      expect(result).toBeNull();
    });
  });

  // ─── getUserById ──────────────────────────────────────────────
  describe('getUserById', () => {
    it('should return user when id exists', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await repo.getUserById('user123');
      expect(result).toEqual(mockUser);
      expect(UserModel.findById).toHaveBeenCalledWith('user123');
    });

    it('should return null when id not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      const result = await repo.getUserById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── updateUser ───────────────────────────────────────────────
  describe('updateUser', () => {
    it('should update and return the updated user', async () => {
      const updated = { ...mockUser, fullName: 'Jane Doe' };
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const result = await repo.updateUser('user123', { fullName: 'Jane Doe' });
      expect(result).toEqual(updated);
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { fullName: 'Jane Doe' }, { new: true });
    });

    it('should return null if user not found', async () => {
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      const result = await repo.updateUser('nonexistent', { fullName: 'Jane' });
      expect(result).toBeNull();
    });

    it('should throw if DB update fails', async () => {
      (UserModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('DB failure'));
      await expect(repo.updateUser('user123', {})).rejects.toThrow('DB failure');
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────
  describe('deleteUser', () => {
    it('should return true when user is deleted', async () => {
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);
      expect(await repo.deleteUser('user123')).toBe(true);
    });

    it('should return false when user not found', async () => {
      (UserModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      expect(await repo.deleteUser('nonexistent')).toBe(false);
    });
  });

  // ─── getAllUsers ──────────────────────────────────────────────
  describe('getAllUsers', () => {
    const mockChain = (result: any[], total: number) => {
      (UserModel.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(result),
          }),
        }),
      });
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(total);
    };

    it('should return paginated users and total count', async () => {
      mockChain([mockUser], 1);
      const result = await repo.getAllUsers({ page: 1, size: 10 });
      expect(result.users).toEqual([mockUser]);
      expect(result.totalUsers).toBe(1);
    });

    it('should apply search filter when search string provided', async () => {
      mockChain([mockUser], 1);
      await repo.getAllUsers({ page: 1, size: 10, search: 'John' });
      const filterArg = (UserModel.find as jest.Mock).mock.calls[0][0];
      expect(filterArg.$or).toBeDefined();
      expect(filterArg.$or[0].fullName.$regex).toBe('John');
      expect(filterArg.$or[1].email.$regex).toBe('John');
      expect(filterArg.$or[2].phoneNumber.$regex).toBe('John');
    });

    it('should use empty filter when no search provided', async () => {
      mockChain([], 0);
      await repo.getAllUsers({ page: 1, size: 10 });
      const filterArg = (UserModel.find as jest.Mock).mock.calls[0][0];
      expect(filterArg.$or).toBeUndefined();
    });

    it('should correctly calculate skip: (page-1) * size', async () => {
      const skipMock = jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      (UserModel.find as jest.Mock).mockReturnValue({ skip: skipMock });
      (UserModel.countDocuments as jest.Mock).mockResolvedValue(0);
      await repo.getAllUsers({ page: 3, size: 10 });
      expect(skipMock).toHaveBeenCalledWith(20); // (3-1) * 10
    });

    it('should return empty users and zero total when no match', async () => {
      mockChain([], 0);
      const result = await repo.getAllUsers({ page: 1, size: 10, search: 'nobody' });
      expect(result.users).toEqual([]);
      expect(result.totalUsers).toBe(0);
    });
  });
});