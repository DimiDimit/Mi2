export interface Profile {
  name: string;
  email: string;
  isArtist: boolean;
  bookmarks?: string[];
}

export interface Artist {
  name: string;
  description: string;
  nextExample?: number;
}

export interface Report {
  reporter: string;
  reportee: string;
  message: string;
}
