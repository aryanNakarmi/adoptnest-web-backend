
export class AnimalPostService {
    async createPost(data: CreateAnimalPostDTO) {
        return await animalPostRepository.createPost(data);
    }

    async getPostById(id: string) {
        return await animalPostRepository.getPostById(id);
    }

    async getAllPosts() {
        return await animalPostRepository.getAllPosts();
    }

    async updatePost(id: string, data: UpdateAnimalPostDTO) {
        return await animalPostRepository.updatePost(id, data);
    }

    async updatePostStatus(id: string, data: UpdateAnimalPostStatusDTO) {
        return await animalPostRepository.updatePostStatus(id, data.status, data.adoptedBy);
    }

    async deletePost(id: string) {
        return await animalPostRepository.deletePost(id);
    }
}

export const animalPostService = new AnimalPostService();
