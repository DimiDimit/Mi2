export interface Profile {
  isArtist: boolean;
  bookmarks?: string[];
}

export interface Artist {
  name: string;
  description: string;
  nextExample?: number;
}
