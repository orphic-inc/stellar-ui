export interface components {
  schemas: {
    AuthUser: {
      id: number;
      username: string;
      avatar: string | null;
      email?: string;
      inviteCount?: number;
      dateRegistered?: string;
      lastLogin?: string | null;
      isArtist?: boolean;
      isDonor?: boolean;
      canDownload?: boolean;
      userRank: {
        level: number;
        name: string;
        color: string;
        badge?: string;
        permissions?: Record<string, boolean>;
      };
    };
  };
}
