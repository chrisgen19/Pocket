export type Bookmark = {
  id: string;
  url: string;
  title: string;
  domain: string;
  excerpt: string;
  imageUrl: string;
  dateAdded: number;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
};

export type SavesCategory = 'home' | 'favorites' | 'archive';
export type SavesView = 'grid' | 'list';
