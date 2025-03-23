import React, { useState } from 'react';
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
  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    // Check if this poll already has a user_vote property
    return Boolean(poll.user_vote);
  });
  
  const totalVotes = Object.values(poll.options).reduce((sum, count) => sum + count, 0);
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
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
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
            {Object.entries(poll.options).map(([option, count]) => (
              <div key={option} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{option}</span>
                  <span>{getPercentage(count)}% ({count} votes)</span>
                </div>
                <Progress value={getPercentage(count)} className="h-2" />
              </div>
            ))}
            {poll.user_vote && (
              <div className="mt-2 text-sm text-muted-foreground">
                You voted for: {poll.user_vote}
              </div>
            )}
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
        {totalVotes > 0 && <span className="ml-auto">{totalVotes} votes</span>}
      </CardFooter>
    </Card>
  );
};

export default PollCard; 