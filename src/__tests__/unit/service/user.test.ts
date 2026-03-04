import { UserService } from '../../../services/user.service';
import { UserRepository } from '../../../repositories/user.repository';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../../repositories/user.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../config/email', () => ({ sendEmail: jest.fn().mockResolvedValue(undefined) }));

const mockUser = { _id: 'user123', fullName: 'John Doe', email: 'john@test.com', password: 'hashed', role: 'user', phoneNumber: null, profilePicture: null };

// user.service.ts creates the repository at module level (let userRepository = new UserRepository())
// so we spy on the prototype to intercept calls on that already-created instance.
const proto = UserRepository.prototype;

describe('UserService - Unit Tests', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks();
  });

  // createUser
  describe('createUser', () => {
    it('hashes password with bcrypt salt 10 and creates user', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(proto, 'createUser').mockResolvedValue(mockUser as any);
      const result = await service.createUser({ fullName: 'John', email: 'john@test.com', password: 'pass123' });
      expect(bcryptjs.hash).toHaveBeenCalledWith('pass123', 10);
      expect(result).toEqual(mockUser);
    });
    it('throws 409 when email is already in use', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(mockUser as any);
      await expect(service.createUser({ fullName: 'J', email: 'john@test.com', password: 'p' }))
        .rejects.toMatchObject({ statusCode: 409, message: 'Email already in use' });
    });
    it('defaults role to user when not provided', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('hashed');
      jest.spyOn(proto, 'createUser').mockResolvedValue(mockUser as any);
      await service.createUser({ fullName: 'J', email: 'j@test.com', password: 'p' });
      const arg = (proto.createUser as jest.Mock).mock.calls[0][0];
      expect(arg.role).toBe('user');
    });
  });

  // loginUser
  describe('loginUser', () => {
    it('returns token and user on valid credentials', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(mockUser as any);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');
      const result = await service.loginUser({ email: 'john@test.com', password: 'pass123' });
      expect(result.token).toBe('mocktoken');
      expect(result.user).toEqual(mockUser);
    });
    it('JWT payload contains id, email, fullName, role', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(mockUser as any);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocktoken');
      await service.loginUser({ email: 'john@test.com', password: 'pass123' });
      const payload = (jwt.sign as jest.Mock).mock.calls[0][0];
      expect(payload).toMatchObject({ id: 'user123', email: 'john@test.com', fullName: 'John Doe', role: 'user' });
    });
    it('throws 404 when user not found', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(null);
      await expect(service.loginUser({ email: 'ghost@test.com', password: 'p' }))
        .rejects.toMatchObject({ statusCode: 404, message: 'User not found' });
    });
    it('throws 401 on wrong password', async () => {
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(mockUser as any);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.loginUser({ email: 'john@test.com', password: 'wrong' }))
        .rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
    });
  });

  // getUserById
  describe('getUserById', () => {
    it('returns user when found', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(mockUser as any);
      expect(await service.getUserById('user123')).toEqual(mockUser);
    });
    it('throws 404 when user not found', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(null);
      await expect(service.getUserById('nope')).rejects.toMatchObject({ statusCode: 404, message: 'User not found' });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.getUserById('')).rejects.toMatchObject({ statusCode: 400, message: 'User ID is required' });
    });
  });

  // deleteUser
  describe('deleteUser', () => {
    it('deletes user when found', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(proto, 'deleteUser').mockResolvedValue(true);
      await service.deleteUser('user123');
      expect(proto.deleteUser).toHaveBeenCalledWith('user123');
    });
    it('throws 404 when user not found', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(null);
      await expect(service.deleteUser('nope')).rejects.toMatchObject({ statusCode: 404 });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.deleteUser('')).rejects.toMatchObject({ statusCode: 400, message: 'User ID is required' });
    });
  });

  // updateUser
  describe('updateUser', () => {
    it('updates and returns user', async () => {
      const updated = { ...mockUser, fullName: 'Jane' };
      jest.spyOn(proto, 'getUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(proto, 'updateUser').mockResolvedValue(updated as any);
      expect(await service.updateUser('user123', { fullName: 'Jane' })).toEqual(updated);
    });
    it('hashes new password with bcrypt when provided', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(proto, 'updateUser').mockResolvedValue(mockUser as any);
      (bcryptjs.hash as jest.Mock).mockResolvedValue('newhashed');
      await service.updateUser('user123', { password: 'newpass' });
      expect(bcryptjs.hash).toHaveBeenCalledWith('newpass', 10);
    });
    it('throws 409 when new email is already taken by another user', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue({ ...mockUser, _id: 'other' } as any);
      await expect(service.updateUser('user123', { email: 'taken@test.com' }))
        .rejects.toMatchObject({ statusCode: 409, message: 'Email already in use' });
    });
    it('skips email uniqueness check when email has not changed', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(mockUser as any);
      jest.spyOn(proto, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(proto, 'updateUser').mockResolvedValue(mockUser as any);
      await service.updateUser('user123', { fullName: 'Jane' });
      expect(proto.getUserByEmail).not.toHaveBeenCalled();
    });
    it('throws 404 when user not found', async () => {
      jest.spyOn(proto, 'getUserById').mockResolvedValue(null);
      await expect(service.updateUser('nope', {})).rejects.toMatchObject({ statusCode: 404 });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.updateUser('', {})).rejects.toMatchObject({ statusCode: 400, message: 'User ID is required' });
    });
  });

  // getAllUsers
  describe('getAllUsers', () => {
    it('returns users with pagination metadata', async () => {
      jest.spyOn(proto, 'getAllUsers').mockResolvedValue({ users: [mockUser] as any, totalUsers: 1 });
      const result = await service.getAllUsers({ page: '1', size: '10' });
      expect(result.users).toEqual([mockUser]);
      expect(result.pagination).toEqual({ page: 1, size: 10, total: 1, totalPages: 1 });
    });
    it('defaults page to 1 and size to 10 when not provided', async () => {
      jest.spyOn(proto, 'getAllUsers').mockResolvedValue({ users: [], totalUsers: 0 });
      await service.getAllUsers({});
      expect(proto.getAllUsers).toHaveBeenCalledWith({ page: 1, size: 10, search: '' });
    });
    it('calculates totalPages as ceil(total / size)', async () => {
      jest.spyOn(proto, 'getAllUsers').mockResolvedValue({ users: [] as any, totalUsers: 25 });
      const result = await service.getAllUsers({ page: '1', size: '10' });
      expect(result.pagination.totalPages).toBe(3);
    });
    it('passes search string to repository when provided', async () => {
      jest.spyOn(proto, 'getAllUsers').mockResolvedValue({ users: [], totalUsers: 0 });
      await service.getAllUsers({ search: 'john' });
      expect(proto.getAllUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'john' }));
    });
  });
});