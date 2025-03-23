import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useChatContext, Poll } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ColorPreset } from '@/contexts/ChatThemeContext';

interface PollCardProps {
  poll: Poll;
  colorPreset?: ColorPreset;
}

const PollCard: React.FC<PollCardProps> = ({ poll, colorPreset }) => {
  const { votePoll } = useChatContext();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [showVoters, setShowVoters] = useState(false);
  
  // Determine if user has voted and update hasVoted state
  useEffect(() => {
    // Only run this if we have poll data
    if (poll) {
      let userVoted = false;
      
      // Check if user has voted by looking for their ID in voters
      if (user && poll.voters) {
        userVoted = Object.keys(poll.voters).some(
          voterId => String(voterId) === String(user.id)
        );
      }
      
      // Also check for local-user votes from before authentication
      if (!userVoted && poll.voters) {
        userVoted = Object.keys(poll.voters).includes('local-user');
      }
      
      // Check if the poll has a user_vote property already set
      const hasUserVote = Boolean(poll.user_vote);
      
      // Set hasVoted if either condition is true
      setHasVoted(userVoted || hasUserVote);
      
      // Also set selectedOption if we have a user_vote
      if (poll.user_vote && !selectedOption) {
        setSelectedOption(poll.user_vote);
      }
      
      // For debugging
      console.log(`Poll ${poll.id} vote check:`, {
        poll_id: poll.id,
        question: poll.question,
        userVoted: userVoted,
        hasUserVote: hasUserVote,
        user_id: user?.id,
        localUserVote: poll.voters ? Object.keys(poll.voters).includes('local-user') : false,
        voters: poll.voters ? Object.keys(poll.voters) : [],
        user_vote: poll.user_vote
      });
    }
  }, [poll, user, selectedOption]);
  
  // Function to manually update poll with data from localStorage
  const updatePollFromLocalStorage = useCallback(() => {
    try {
      const pollsInStorage = localStorage.getItem('roomly_polls_cache');
      if (pollsInStorage) {
        const pollCache = JSON.parse(pollsInStorage);
        const updatedPollData = pollCache.polls.find((p: Poll) => 
          String(p.id) === String(poll.id)
        );
        
        if (updatedPollData && updatedPollData.voters) {
          // This would ideally update the poll prop, but since props are read-only,
          // we update our local state to reflect these changes
          if (updatedPollData.user_vote) {
            setSelectedOption(updatedPollData.user_vote);
          }
          
          const hasUserVotedInData = user 
            ? Object.keys(updatedPollData.voters).includes(String(user.id))
            : Object.keys(updatedPollData.voters).includes('local-user');
            
          if (hasUserVotedInData) {
            setHasVoted(true);
          }
          
          console.log('Updated poll data from localStorage:', updatedPollData);
        }
      }
    } catch (e) {
      console.error('Failed to update poll from localStorage:', e);
    }
  }, [poll.id, user]);
  
  // Effect to update poll from localStorage after voting
  useEffect(() => {
    if (hasVoted) {
      // We use a small timeout to ensure localStorage is updated first
      const timer = setTimeout(() => {
        updatePollFromLocalStorage();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [hasVoted, updatePollFromLocalStorage]);
  
  // Log poll info for debugging
  useEffect(() => {
    if (poll.id) {
      console.log(`Poll ${poll.id} render info:`, {
        question: poll.question,
        userVote: poll.user_vote,
        hasVoters: !!poll.voters,
        voterCount: poll.voters ? Object.keys(poll.voters).length : 0,
        currentUserId: user?.id,
        userInVoters: user && poll.voters ? Object.keys(poll.voters).includes(String(user.id)) : false,
        hasVoted: hasVoted
      });
    }
  }, [poll, user, hasVoted]);
  
  // Add useEffect to reload data from localStorage when needed
  useEffect(() => {
    if (hasVoted && !poll.user_vote) {
      // Try to get updated poll data from localStorage
      updatePollFromLocalStorage();
    }
  }, [hasVoted, poll.id, poll.user_vote, updatePollFromLocalStorage]);
  
  // Memoize total votes calculation to prevent recalculation on every render
  const totalVotes = useCallback(() => {
    return Object.values(poll.options).reduce((sum, count) => sum + count, 0);
  }, [poll.options]);

  const memoizedTotalVotes = useCallback(() => {
    // Use the stored total_votes if available (for optimistic updates)
    if (poll.total_votes !== undefined) {
      return poll.total_votes;
    }
    // Otherwise calculate from options
    return totalVotes();
  }, [poll.total_votes, totalVotes]);
  
  const isPollExpired = new Date(poll.expires_at) < new Date();
  
  const handleVote = () => {
    if (selectedOption && !hasVoted && !isPollExpired) {
      // Convert poll.id to number if it's a string to match the context API
      const pollId = typeof poll.id === 'string' ? parseInt(poll.id, 10) : poll.id;
      
      console.log(`Voting on poll ID: ${pollId}, option: ${selectedOption}`);
      console.log(`Poll info:`, {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        isTemporary: pollId < 0
      });
      
      // Check if user is authenticated
      if (!user) {
        console.error('Cannot vote: user not authenticated yet');
        
        // Apply optimistic update manually for temporary polls
        if (pollId < 0) {
          // Create an updated version of the poll with vote
          const updatedOptions = { ...poll.options };
          updatedOptions[selectedOption] = (updatedOptions[selectedOption] || 0) + 1;
          
          const updatedVoters = { ...(poll.voters || {}) };
          // Use 'local-user' as a temporary user ID
          updatedVoters['local-user'] = selectedOption;
          
          // Create a manually updated poll
          const updatedPoll: Poll = {
            ...poll,
            options: updatedOptions,
            user_vote: selectedOption,
            voters: updatedVoters,
            total_votes: (poll.total_votes || 0) + 1
          };
          
          // Update UI state first for immediate feedback
          setHasVoted(true);
          
          // Store in localStorage to persist
          try {
            const pollsInStorage = localStorage.getItem('roomly_polls_cache');
            if (pollsInStorage) {
              const pollCache = JSON.parse(pollsInStorage);
              const updatedPolls = pollCache.polls.map((p: Poll) => 
                String(p.id) === String(pollId) ? updatedPoll : p
              );
              
              localStorage.setItem('roomly_polls_cache', JSON.stringify({
                ...pollCache,
                polls: updatedPolls
              }));
              
              console.log('Manually saved poll vote to localStorage');
            }
            
            // Also update the household-specific storage
            const householdId = poll.household_id;
            if (householdId) {
              const key = `roomly_household_polls_${householdId}`;
              const savedPolls = localStorage.getItem(key);
              if (savedPolls) {
                try {
                  const householdPolls = JSON.parse(savedPolls);
                  const updatedHouseholdPolls = householdPolls.map((p: Poll) => 
                    String(p.id) === String(pollId) ? updatedPoll : p
                  );
                  
                  localStorage.setItem(key, JSON.stringify(updatedHouseholdPolls));
                  console.log(`Manually updated polls for household ${householdId}`);
                } catch (e) {
                  console.error(`Failed to update polls for household ${householdId}:`, e);
                }
              }
            }
          } catch (e) {
            console.error('Failed to manually save poll vote:', e);
          }
        } else {
          alert('Please log in to vote on polls');
        }
        return;
      }
      
      votePoll(pollId, selectedOption);
      setHasVoted(true);
    }
  };
  
  const formatExpiryTime = (expiryDate: string) => {
    try {
      return formatDistanceToNow(new Date(expiryDate), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Calculate the percentage for a given option
  const getPercentage = (count: number) => {
    if (totalVotes() === 0) return 0;
    return Math.round((count / totalVotes()) * 100);
  };
  
  // Add a helper to get user initial for avatar
  const getUserInitial = (email: string) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };
  
  return (
    <Card className={cn(
      "w-full",
      colorPreset?.messageCard || "",
      colorPreset?.border || "",
      "shadow-sm"
    )}>
      <CardHeader className={cn("pb-2", "border-b border-muted")}>
        <CardTitle className="text-base">{poll.question}</CardTitle>
        <CardDescription>
          {isPollExpired 
            ? 'Poll has ended' 
            : `Expires ${formatExpiryTime(poll.expires_at)}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {hasVoted || isPollExpired ? (
          // Results view
          <div className="space-y-3">
            {Object.entries(poll.options).map(([option, count]) => {
              // Check if this is the user's vote from the user_vote prop
              // or from the voters object
              const isUserVote = 
                poll.user_vote === option || 
                (poll.voters && user && poll.voters[user.id] === option) ||
                (poll.voters && !user && poll.voters['local-user'] === option);
                
              const finalCount = count;
              const calculatedTotalVotes = memoizedTotalVotes();
              
              return (
                <div key={option} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isUserVote ? "font-medium text-primary" : ""}>
                      {option} {isUserVote && "✓"}
                    </span>
                    <span>{getPercentage(finalCount)}% ({finalCount} votes)</span>
                  </div>
                  <Progress 
                    value={getPercentage(finalCount)} 
                    className={cn(
                      "h-2",
                      isUserVote ? "bg-primary/70 dark:bg-primary/90" : ""
                    )} 
                  />
                </div>
              );
            })}
            {(poll.user_vote || (poll.voters && ((user && poll.voters[user.id]) || (!user && poll.voters['local-user'])))) && (
              <div className="mt-2 text-sm text-muted-foreground">
                You voted for: {poll.user_vote || 
                  (poll.voters && user && poll.voters[user.id]) || 
                  (poll.voters && !user && poll.voters['local-user'])}
              </div>
            )}
            
            {showVoters && poll.voters && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Votes:</h4>
                <ul className="text-sm space-y-2">
                  {Object.entries(poll.voters).map(([voterId, voterOption]) => {
                    // Handle special case for local-user (temporary votes)
                    if (voterId === 'local-user') {
                      // If we have a real user now, show it as the current user
                      const isAuthenticated = !!user;
                      return (
                        <li key={voterId} className="flex items-center gap-2">
                          <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs",
                            "bg-primary text-primary-foreground"
                          )}>
                            {isAuthenticated ? user.email.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <span className="font-medium">
                            {isAuthenticated ? 'You' : 'You (temporary)'}: <span className="text-primary">{voterOption}</span>
                          </span>
                        </li>
                      );
                    }
                    
                    // Regular user vote
                    const isCurrentUser = user && String(voterId) === String(user.id);
                    // Extract email from voter ID if it looks like an email
                    const displayName = isCurrentUser 
                      ? 'You' 
                      : (voterId.includes('@') ? voterId : `User ${voterId}`);
                    
                    // Get initial for avatar
                    const initial = getUserInitial(voterId);
                        
                    return (
                      <li key={voterId} className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs",
                          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {initial}
                        </div>
                        <span className={isCurrentUser ? "font-medium" : ""}>
                          {displayName}: <span className="text-primary">{voterOption}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => setShowVoters(!showVoters)}
            >
              {showVoters ? "Hide votes" : "Show votes"}
            </Button>
          </div>
        ) : (
          // Voting view
          <RadioGroup onValueChange={setSelectedOption} value={selectedOption || undefined}>
            {Object.keys(poll.options).map((option) => (
              <div key={option} className="flex items-center space-x-2 py-1">
                <RadioGroupItem value={option} id={`option-${option}`} />
                <Label htmlFor={`option-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
      
      {!hasVoted && !isPollExpired && (
        <CardFooter>
          <Button 
            onClick={handleVote} 
            disabled={!selectedOption}
            className="w-full"
          >
            Vote
          </Button>
        </CardFooter>
      )}
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <span>Created by {poll.created_by}</span>
        {memoizedTotalVotes() > 0 && <span className="ml-auto">{memoizedTotalVotes()} votes</span>}
      </CardFooter>
    </Card>
  );
};

export default PollCard; 