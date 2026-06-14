export interface ReviewDto {
  id: number;
  productId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string; // В Angular даты приходят строками (ISO)
  adminResponse?: string;
  adminResponseDate?: string;
}

export interface CreateReviewDto {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}

export interface ModerateReviewDto {
  isApproved: boolean;
  adminResponse?: string;
}

export interface CommentDto {
  id: number;
  userName: string;
  text: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  userReaction?: 'Like' | 'Dislike' | null;
  isMine: boolean;
}

export interface ReviewDto {
  id: number;
  productId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  adminResponse?: string;
  adminResponseDate?: string;
  likesCount: number;
  dislikesCount: number;
  userReaction?: 'Like' | 'Dislike' | null;
  comments: CommentDto[];
  isMine: boolean;
}
