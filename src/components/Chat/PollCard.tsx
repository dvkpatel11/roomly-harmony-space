import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useChatContext, Poll } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

interface PollCardProps {
  poll: Poll;
}

const PollCard: React.FC<PollCardProps> = ({ poll }) => {
  const { votePoll } = useChatContext();
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  const totalVotes = Object.values(poll.options).reduce((sum, count) => sum + count, 0);
  const isPollExpired = new Date(poll.expires_at) < new Date();
  
  const handleVote = () => {
    if (selectedOption && !hasVoted && !isPollExpired) {
      votePoll(poll.id, selectedOption);
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
    <Card className="w-full">
      <CardHeader className="pb-2">
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