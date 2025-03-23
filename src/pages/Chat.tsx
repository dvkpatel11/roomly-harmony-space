import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatRoom from '@/components/Chat/ChatRoom';
import { useAuth } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import ImageCacheManager from '@/components/Chat/ImageCacheManager';
import ImageDiagnostics from '@/components/Chat/ImageDiagnostics';

const Chat = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const { token } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  
  // Memoize the ChatRoom to prevent unmounts when parent re-renders
  const memoizedChatRoom = useMemo(() => {
    if (!householdId) return null;
    return <ChatRoom householdId={householdId} householdName="Household Chat" />;
  }, [householdId]);
  
  // Toggle debug panel
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

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
        <ImageCacheManager />
        
        {/* Debug panel - development mode only */}
        {process.env.NODE_ENV === 'development' && (
          <>
            {showDebug && (
              <div className="mb-4">
                <ImageDiagnostics />
              </div>
            )}
            
            {/* Floating debug button */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleDebug}
              className="fixed bottom-4 right-4 z-50 rounded-full shadow-md h-12 w-12"
            >
              <Bug className={`h-6 w-6 ${showDebug ? 'text-green-500' : 'text-gray-500'}`} />
            </Button>
          </>
        )}
        
        {memoizedChatRoom}
      </div>
    </ChatProvider>
  );
};

export default Chat; 