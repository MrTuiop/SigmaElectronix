export interface ReviewDto {
  readonly id: number;
  readonly productId: number;
  readonly userName: string;
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
  readonly createdAt: string;
  readonly adminResponse?: string;
  readonly adminResponseDate?: string;
  readonly likesCount: number;
  readonly dislikesCount: number;
  readonly userReaction?: 'Like' | 'Dislike' | null;
  readonly comments: readonly CommentDto[];
  readonly isMine: boolean;
}

export interface CommentDto {
  readonly id: number;
  readonly userName: string;
  readonly text: string;
  readonly createdAt: string;
  readonly likesCount: number;
  readonly dislikesCount: number;
  readonly userReaction?: 'Like' | 'Dislike' | null;
  readonly isMine: boolean;
}

export interface CreateReviewDto {
  readonly productId: number;
  readonly rating: number;
  readonly title: string;
  readonly comment: string;
}

export interface ModerateReviewDto {
  readonly isApproved: boolean;
  readonly adminResponse?: string;
}
