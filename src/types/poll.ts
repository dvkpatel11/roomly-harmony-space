export interface Poll {
  id: string;
  question: string;
  options: string[];
  expires_at: string | null;
  created_at: string;
  household_id: string;
  created_by: string;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  expires_at?: string;
}

export interface CreatePollResponse {
  message: string;
  poll: {
    id: string;
    question: string;
    options: string[];
    expires_at: string | null;
    created_by: string;
  };
}

export interface VoteRequest {
  option_index: number;
}

export interface VoteResponse {
  message: string;
  poll: {
    id: string;
    votes: Array<{
      user_id: string;
      selected_option: string;
    }>;
  };
}

export interface PollVoteCount {
  option_index: number;
  count: number;
}

export interface PollResponse {
  id: string;
  question: string;
  options: string[];
  expires_at: string | null;
  created_at: string;
  created_by: string;
  votes: Array<{
    user_id: string;
    selected_option: string;
  }>;
}

export interface PollResultsResponse {
  poll: Poll;
  votes: {
    option: string;
    count: number;
    percentage: number;
    voters: Array<{
      user_id: string;
      email: string;
    }>;
  }[];
}

export interface PollService {
  createPoll(householdId: string, request: CreatePollRequest): Promise<CreatePollResponse>;
  getPoll(pollId: string): Promise<PollResponse>;
  getPolls(
    householdId: string,
    params?: {
      active?: boolean;
      page?: number;
      perPage?: number;
    }
  ): Promise<PollResponse[]>;
  getPollResults(pollId: string): Promise<PollResultsResponse>;
  vote(pollId: string, request: VoteRequest): Promise<VoteResponse>;
  deletePoll(pollId: string): Promise<void>;
  subscribeToPollUpdates(pollId: string, callback: (results: PollResultsResponse) => void): () => void;
}
