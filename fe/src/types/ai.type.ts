export interface AiSuggestedProduct {
  productId: string;
  name: string;
  slug: string;
  minPrice?: number;
  imageUrl?: string;
}

export interface AiChatResponse {
  conversationId: string;
  answer: string;
  routeType?: string;
  suggestedProducts?: AiSuggestedProduct[];
  warnings?: string[];
  transcript?: string;
  sourceImageUrl?: string;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestedProducts?: AiSuggestedProduct[];
  warnings?: string[];
  transcript?: string;
  sourceImageUrl?: string;
}
