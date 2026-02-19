export interface CreateAnimalDTO {
  species: string;
  gender: 'Male' | 'Female';
  age: number;
  description: string;
  location: string;
  photos: string[]; // array of photo URLs
}

export interface UpdateAnimalDTO {
  species?: string;
  gender?: 'Male' | 'Female';
  age?: number;
  description?: string;
  location?: string;
  photos?: string[];
}
