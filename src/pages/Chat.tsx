import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatRoom from '@/components/Chat/ChatRoom';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';

const Chat = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const { token } = useAuth();
  
  if (!householdId) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">No Household Selected</h2>
        <p className="text-muted-foreground mb-6">Please select a household to chat with.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }
  
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }
  
  return (
    <ChatProvider>
      <div className="flex flex-col h-full">
        <ChatRoom householdId={householdId} householdName="Household Chat" />
      </div>
    </ChatProvider>
  );
};

export default Chat; 