import React, { useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChatContext } from '@/contexts/ChatContext';
import { addDays } from 'date-fns';

interface CreatePollDialogProps {
  householdId: string;
}

const CreatePollDialog: React.FC<CreatePollDialogProps> = ({ householdId }) => {
  const { createPoll } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiryDays, setExpiryDays] = useState('1');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };
  
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // Clear error when user makes changes
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty options
    const validOptions = options.filter(opt => opt.trim() !== '');
    
    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      setErrorMessage("Please remove duplicate options");
      return;
    }
    
    if (question.trim() && validOptions.length >= 2) {
      // Calculate expiry date - default to 1 day if invalid
      const days = parseInt(expiryDays) || 1;
      const expiryDate = addDays(new Date(), days).toISOString();
      
      createPoll(question.trim(), validOptions, expiryDate);
      
      // Reset form and close dialog
      setQuestion('');
      setOptions(['', '']);
      setExpiryDays('1');
      setErrorMessage(null);
      setIsOpen(false);
    }
  };
  
  const isFormValid = 
    question.trim() !== '' && 
    options.filter(opt => opt.trim() !== '').length >= 2 &&
    parseInt(expiryDays) > 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <BarChart3 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a Poll</DialogTitle>
            <DialogDescription>
              Create a poll for your household members to vote on.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your question?"
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Options (minimum 2)</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {errorMessage && (
                <div className="text-sm font-medium text-destructive mt-2">
                  {errorMessage}
                </div>
              )}
              
              {options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expiry">Poll Duration (days)</Label>
              <Input
                id="expiry"
                type="number"
                min="1"
                max="30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Create Poll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog; 