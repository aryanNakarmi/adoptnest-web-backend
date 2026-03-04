import { AnimalPostRepository } from '../../../repositories/animalpost.repository';
import { AnimalPostModel } from '../../../models/animalpost.model';

jest.mock('../../../models/animalpost.model');

const mockPost = { _id: 'post123', species: 'Dog', gender: 'Male', breed: 'Labrador', age: 2, location: 'Kathmandu', description: 'Friendly dog', photos: ['/photo.jpg'], status: 'Available', adoptedBy: null, adoptedDate: null, adoptionRequests: [] };

describe('AnimalPostRepository - Unit Tests', () => {
  let repo: AnimalPostRepository;
  beforeEach(() => { repo = new AnimalPostRepository(); jest.clearAllMocks(); });

  describe('createPost', () => {
    it('creates and saves a post', async () => {
      const save = jest.fn().mockResolvedValue(mockPost);
      (AnimalPostModel as any).mockImplementation(() => ({ save }));
      expect(await repo.createPost({ species: 'Dog' })).toEqual(mockPost);
      expect(save).toHaveBeenCalledTimes(1);
    });
    it('throws if save fails', async () => {
      (AnimalPostModel as any).mockImplementation(() => ({ save: jest.fn().mockRejectedValue(new Error('fail')) }));
      await expect(repo.createPost({})).rejects.toThrow('fail');
    });
  });

  describe('getPostById', () => {
    it('returns post with populated adoptedBy', async () => {
      (AnimalPostModel.findById as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockPost) });
      expect(await repo.getPostById('post123')).toEqual(mockPost);
      expect(AnimalPostModel.findById).toHaveBeenCalledWith('post123');
    });
    it('returns null when not found', async () => {
      (AnimalPostModel.findById as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      expect(await repo.getPostById('nope')).toBeNull();
    });
  });

  describe('getAllPosts', () => {
    it('returns posts sorted by createdAt desc', async () => {
      const sortMock = jest.fn().mockResolvedValue([mockPost]);
      (AnimalPostModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: sortMock }) });
      expect(await repo.getAllPosts()).toEqual([mockPost]);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    });
    it('returns empty array when no posts', async () => {
      (AnimalPostModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getAllPosts()).toEqual([]);
    });
  });

  describe('getMyAdoptions', () => {
    it('queries by adoptedBy and sorts by updatedAt desc', async () => {
      const sortMock = jest.fn().mockResolvedValue([mockPost]);
      (AnimalPostModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: sortMock }) });
      expect(await repo.getMyAdoptions('user123')).toEqual([mockPost]);
      expect(AnimalPostModel.find).toHaveBeenCalledWith({ adoptedBy: 'user123' });
      expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 });
    });
    it('returns empty array if user has no adoptions', async () => {
      (AnimalPostModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getMyAdoptions('user999')).toEqual([]);
    });
  });

  describe('getPostsBySpecies', () => {
    it('uses case-insensitive regex', async () => {
      (AnimalPostModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockPost]) }) });
      expect(await repo.getPostsBySpecies('dog')).toEqual([mockPost]);
      expect(AnimalPostModel.find).toHaveBeenCalledWith({ species: { $regex: 'dog', $options: 'i' } });
    });
    it('returns empty array when no match', async () => {
      (AnimalPostModel.find as jest.Mock).mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) });
      expect(await repo.getPostsBySpecies('dragon')).toEqual([]);
    });
  });

  describe('updatePostStatus', () => {
    it('sets adoptedBy and adoptedDate when Adopted', async () => {
      const updated = { ...mockPost, status: 'Adopted', adoptedBy: 'user123' };
      (AnimalPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(updated) });
      expect(await repo.updatePostStatus('post123', 'Adopted', 'user123')).toEqual(updated);
      const [, arg, opts] = (AnimalPostModel.findByIdAndUpdate as jest.Mock).mock.calls[0];
      expect(arg.adoptedBy).toBe('user123');
      expect(arg.adoptedDate).toBeInstanceOf(Date);
      expect(opts).toEqual({ new: true });
    });
    it('nulls out adoptedBy and adoptedDate when Available', async () => {
      (AnimalPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockPost) });
      await repo.updatePostStatus('post123', 'Available');
      const [, arg] = (AnimalPostModel.findByIdAndUpdate as jest.Mock).mock.calls[0];
      expect(arg.adoptedBy).toBeNull();
      expect(arg.adoptedDate).toBeNull();
    });
    it('defaults adoptedBy to null when Adopted without adoptedBy param', async () => {
      (AnimalPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(mockPost) });
      await repo.updatePostStatus('post123', 'Adopted');
      const [, arg] = (AnimalPostModel.findByIdAndUpdate as jest.Mock).mock.calls[0];
      expect(arg.adoptedBy).toBeNull();
    });
    it('returns null when post not found', async () => {
      (AnimalPostModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      expect(await repo.updatePostStatus('nope', 'Adopted')).toBeNull();
    });
  });

  describe('updatePost', () => {
    it('calls findByIdAndUpdate with { new: true } and returns updated post', async () => {
      const updated = { ...mockPost, breed: 'Poodle' };
      (AnimalPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);
      expect(await repo.updatePost('post123', { breed: 'Poodle' })).toEqual(updated);
      expect(AnimalPostModel.findByIdAndUpdate).toHaveBeenCalledWith('post123', { breed: 'Poodle' }, { new: true });
    });
    it('returns null when post not found', async () => {
      (AnimalPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);
      expect(await repo.updatePost('nope', {})).toBeNull();
    });
  });

  describe('deletePost', () => {
    it('returns true when deleted', async () => {
      (AnimalPostModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockPost);
      expect(await repo.deletePost('post123')).toBe(true);
    });
    it('returns false when not found', async () => {
      (AnimalPostModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);
      expect(await repo.deletePost('nope')).toBe(false);
    });
  });
});