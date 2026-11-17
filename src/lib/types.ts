// Shapes shared by the API and the browser. Nothing here can say who liked whom.

export type SwipeAction = "like" | "pass";

/** The only profile fields that ever leave the server. */
export interface PublicProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  college: string | null;
  bio: string;
  interests: string[];
  avatarUrl: string;
}

export interface MatchedProfile extends PublicProfile {
  matchedAt: string;
}

export interface FeedResponse {
  profiles: PublicProfile[];
}

export interface SwipeRequest {
  profileId: string;
  action: SwipeAction;
}

export interface SwipeResponse {
  matched: boolean;
}

export interface MatchesResponse {
  matches: MatchedProfile[];
}

export interface ErrorResponse {
  success: false;
  message: string;
}
