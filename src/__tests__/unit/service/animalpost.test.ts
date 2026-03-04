import { AnimalPostService } from '../../../services/animalpost.service';
import { AnimalPostRepository } from '../../../repositories/animalpost.repository';

jest.mock('../../../repositories/animalpost.repository');

const mockPost = { _id: 'post123', species: 'Dog', gender: 'Male', breed: 'Labrador', age: 2, location: 'Kathmandu', description: 'Friendly dog', photos: ['/dog.jpg'], status: 'Available', adoptedBy: null, adoptedDate: null, adoptionRequests: [] };
const validInput = { species: 'Dog', gender: 'Male' as const, breed: 'Labrador', age: 2, location: 'Kathmandu', description: 'Friendly dog', photos: ['/dog.jpg'] };

// animalpost.service.ts creates the repository at module level (let animalPostRepository = new AnimalPostRepository())
// so we spy on the prototype to intercept calls on that already-created instance.
const proto = AnimalPostRepository.prototype;

describe('AnimalPostService - Unit Tests', () => {
  let service: AnimalPostService;

  beforeEach(() => {
    service = new AnimalPostService();
    jest.clearAllMocks();
  });

  // createPost
  describe('createPost', () => {
    it('creates a post and hardcodes status to Available', async () => {
      jest.spyOn(proto, 'createPost').mockResolvedValue(mockPost as any);
      const result = await service.createPost(validInput);
      expect(result).toEqual(mockPost);
      const arg = (proto.createPost as jest.Mock).mock.calls[0][0];
      expect(arg.status).toBe('Available');
    });
    it('throws 400 when species is missing', async () => {
      await expect(service.createPost({ ...validInput, species: '' }))
        .rejects.toMatchObject({ statusCode: 400, message: 'All required fields must be provided' });
    });
    it('throws 400 when photos array is empty', async () => {
      await expect(service.createPost({ ...validInput, photos: [] }))
        .rejects.toMatchObject({ statusCode: 400, message: 'At least one photo is required' });
    });
    it('throws 400 when more than 5 photos provided', async () => {
      await expect(service.createPost({ ...validInput, photos: ['1','2','3','4','5','6'] }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Maximum 5 photos allowed' });
    });
    it('throws 400 when breed is missing', async () => {
      await expect(service.createPost({ ...validInput, breed: '' }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
    it('throws 400 when location is missing', async () => {
      await expect(service.createPost({ ...validInput, location: '' }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // getAllPosts
  describe('getAllPosts', () => {
    it('returns all posts', async () => {
      jest.spyOn(proto, 'getAllPosts').mockResolvedValue([mockPost] as any);
      expect(await service.getAllPosts()).toEqual([mockPost]);
    });
    it('returns empty array when no posts exist', async () => {
      jest.spyOn(proto, 'getAllPosts').mockResolvedValue([]);
      expect(await service.getAllPosts()).toEqual([]);
    });
  });

  // getPostById
  describe('getPostById', () => {
    it('returns post when found', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      expect(await service.getPostById('post123')).toEqual(mockPost);
    });
    it('throws 404 with correct message when not found', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(null);
      await expect(service.getPostById('nope'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Animal post not found' });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.getPostById(''))
        .rejects.toMatchObject({ statusCode: 400, message: 'Post ID is required' });
    });
  });

  // getPostsBySpecies
  describe('getPostsBySpecies', () => {
    it('delegates to repository with the species string', async () => {
      jest.spyOn(proto, 'getPostsBySpecies').mockResolvedValue([mockPost] as any);
      expect(await service.getPostsBySpecies('Dog')).toEqual([mockPost]);
      expect(proto.getPostsBySpecies).toHaveBeenCalledWith('Dog');
    });
    it('throws 400 when species is empty', async () => {
      await expect(service.getPostsBySpecies(''))
        .rejects.toMatchObject({ statusCode: 400, message: 'Species is required' });
    });
  });

  // getMyAdoptions
  describe('getMyAdoptions', () => {
    it('delegates to repository with userId', async () => {
      jest.spyOn(proto, 'getMyAdoptions').mockResolvedValue([mockPost] as any);
      expect(await service.getMyAdoptions('user123')).toEqual([mockPost]);
      expect(proto.getMyAdoptions).toHaveBeenCalledWith('user123');
    });
    it('throws 400 when userId is empty', async () => {
      await expect(service.getMyAdoptions(''))
        .rejects.toMatchObject({ statusCode: 400, message: 'User ID is required' });
    });
  });

  // updatePost
  describe('updatePost', () => {
    it('merges existing post with update data before calling repo', async () => {
      const updated = { ...mockPost, breed: 'Poodle' };
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      jest.spyOn(proto, 'updatePost').mockResolvedValue(updated as any);
      expect(await service.updatePost('post123', { breed: 'Poodle' })).toEqual(updated);
      const arg = (proto.updatePost as jest.Mock).mock.calls[0][1];
      expect(arg.species).toBe('Dog');
      expect(arg.breed).toBe('Poodle');
    });
    it('throws 404 when post not found', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(null);
      await expect(service.updatePost('nope', {}))
        .rejects.toMatchObject({ statusCode: 404, message: 'Animal post not found' });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.updatePost('', {}))
        .rejects.toMatchObject({ statusCode: 400, message: 'Post ID is required' });
    });
  });

  // updatePostStatus
  describe('updatePostStatus', () => {
    it('calls repo with Adopted status and adoptedBy', async () => {
      const updated = { ...mockPost, status: 'Adopted', adoptedBy: 'user123' };
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      jest.spyOn(proto, 'updatePostStatus').mockResolvedValue(updated as any);
      const result = await service.updatePostStatus('post123', { status: 'Adopted', adoptedBy: 'user123' });
      expect(result).toEqual(updated);
      expect(proto.updatePostStatus).toHaveBeenCalledWith('post123', 'Adopted', 'user123');
    });
    it('calls repo with Available status', async () => {
      const updated = { ...mockPost, status: 'Available', adoptedBy: null };
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      jest.spyOn(proto, 'updatePostStatus').mockResolvedValue(updated as any);
      expect((await service.updatePostStatus('post123', { status: 'Available' })).status).toBe('Available');
      expect(proto.updatePostStatus).toHaveBeenCalledWith('post123', 'Available', undefined);
    });
    it('throws 400 for invalid status value', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      await expect(service.updatePostStatus('post123', { status: 'Pending' as any }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Invalid status. Must be Available or Adopted' });
    });
    it('status validation runs BEFORE fetching post from DB', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      await expect(service.updatePostStatus('post123', { status: 'BadStatus' as any }))
        .rejects.toMatchObject({ statusCode: 400 });
    });
    it('throws 404 when post not found', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(null);
      await expect(service.updatePostStatus('nope', { status: 'Adopted' }))
        .rejects.toMatchObject({ statusCode: 404 });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.updatePostStatus('', { status: 'Adopted' }))
        .rejects.toMatchObject({ statusCode: 400, message: 'Post ID is required' });
    });
  });

  // deletePost
  describe('deletePost', () => {
    it('calls repo deletePost when post exists', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(mockPost as any);
      jest.spyOn(proto, 'deletePost').mockResolvedValue(true);
      await service.deletePost('post123');
      expect(proto.deletePost).toHaveBeenCalledWith('post123');
    });
    it('throws 404 when post not found', async () => {
      jest.spyOn(proto, 'getPostById').mockResolvedValue(null);
      await expect(service.deletePost('nope'))
        .rejects.toMatchObject({ statusCode: 404, message: 'Animal post not found' });
    });
    it('throws 400 when id is empty', async () => {
      await expect(service.deletePost(''))
        .rejects.toMatchObject({ statusCode: 400, message: 'Post ID is required' });
    });
  });
});