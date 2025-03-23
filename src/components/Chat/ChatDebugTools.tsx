import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { getStorageStats, refreshImage, diagnoseImage } from '../../utils/imageStorage';
import { useChatContext } from '@/contexts/ChatContext';
import ImageDiagnostics from './ImageDiagnostics';

/**
 * ChatDebugTools component
 * Combines image diagnostics and chat debugging features
 */
const ChatDebugTools: React.FC = () => {
  const { messages, polls } = useChatContext();
  const [localStorageData, setLocalStorageData] = useState<{
    messages: any[] | null,
    polls: any[] | null,
    householdMessages: Record<string, any[]>,
    householdPolls: Record<string, any[]>,
    images: Record<string, string>
  }>({
    messages: null,
    polls: null,
    householdMessages: {},
    householdPolls: {},
    images: {}
  });
  const [messagesWithImages, setMessagesWithImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  // Load localStorage data
  const loadLocalStorageData = useCallback(() => {
    setLoading(true);
    addDebugOutput('Loading localStorage data...');
    
    try {
      // General storage
      const messagesCache = localStorage.getItem('messages');
      const pollsCache = localStorage.getItem('polls');
      
      // Household-specific storage
      const householdMessages: Record<string, any[]> = {};
      const householdPolls: Record<string, any[]> = {};
      const images: Record<string, string> = {};
      
      // Scan all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.startsWith('roomly_household_messages_')) {
          const householdId = key.replace('roomly_household_messages_', '');
          const data = localStorage.getItem(key);
          if (data) {
            try {
              householdMessages[householdId] = JSON.parse(data);
              addDebugOutput(`Found ${householdMessages[householdId].length} messages for household ${householdId}`);
            } catch (e) {
              addDebugOutput(`Error parsing messages for household ${householdId}: ${e}`);
            }
          }
        } else if (key.startsWith('roomly_household_polls_')) {
          const householdId = key.replace('roomly_household_polls_', '');
          const data = localStorage.getItem(key);
          if (data) {
            try {
              householdPolls[householdId] = JSON.parse(data);
              addDebugOutput(`Found ${householdPolls[householdId].length} polls for household ${householdId}`);
            } catch (e) {
              addDebugOutput(`Error parsing polls for household ${householdId}: ${e}`);
            }
          }
        } else if (key.startsWith('img_')) {
          const data = localStorage.getItem(key);
          if (data) {
            images[key] = data;
          }
        }
      }
      
      // Set local state with the parsed data
      const parsedMessages = messagesCache ? JSON.parse(messagesCache) : null;
      const parsedPolls = pollsCache ? JSON.parse(pollsCache) : null;
      
      setLocalStorageData({
        messages: parsedMessages,
        polls: parsedPolls,
        householdMessages,
        householdPolls,
        images
      });
      
      addDebugOutput('LocalStorage data loaded successfully');
      
      // Find messages with images
      if (parsedMessages) {
        const withImages = parsedMessages.filter((m: any) => m.image_url?.startsWith('img_'));
        setMessagesWithImages(withImages);
        addDebugOutput(`Found ${withImages.length} messages with images`);
      }
    } catch (error) {
      addDebugOutput(`Error loading localStorage data: ${error}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const repairAllImageMessages = async () => {
    setLoading(true);
    addDebugOutput('Attempting to repair all image messages...');
    
    try {
      // Get current context messages
      const imageMessages = messages.filter(m => m.image_url?.startsWith('img_'));
      addDebugOutput(`Found ${imageMessages.length} image messages in context`);
      
      // Attempt to repair each one
      let success = 0;
      let failed = 0;
      
      for (const message of imageMessages) {
        if (message.image_url) {
          try {
            const diagnosis = await diagnoseImage(message.image_url);
            
            if (diagnosis.exists) {
              await refreshImage(message.image_url);
              success++;
              addDebugOutput(`Successfully refreshed image ${message.image_url}`);
            } else {
              failed++;
              addDebugOutput(`Failed to refresh image ${message.image_url}: Not found`);
            }
          } catch (error) {
            failed++;
            addDebugOutput(`Error refreshing image ${message.image_url}: ${error}`);
          }
        }
      }
      
      addDebugOutput(`Repair completed: ${success} successful, ${failed} failed`);
    } catch (error) {
      addDebugOutput(`Error repairing image messages: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const addDebugOutput = (message: string) => {
    setDebugOutput(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  // Initial load
  useEffect(() => {
    loadLocalStorageData();
  }, [loadLocalStorageData]);

  return (
    <Tabs defaultValue="image-diagnostics" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="image-diagnostics">Image Diagnostics</TabsTrigger>
        <TabsTrigger value="chat-debug">Chat Debug</TabsTrigger>
      </TabsList>
      
      <TabsContent value="image-diagnostics" className="mt-4">
        <ImageDiagnostics />
      </TabsContent>
      
      <TabsContent value="chat-debug" className="mt-4">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Chat Debug Tools</CardTitle>
            <CardDescription>
              Diagnose and fix issues with chat message storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outline"
                onClick={loadLocalStorageData}
                disabled={loading}
                className="flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Scan Storage
              </Button>
              
              <Button
                variant="default"
                onClick={repairAllImageMessages}
                disabled={loading}
                className="flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Repair All Images
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Messages summary */}
              <div className="border rounded-md p-3">
                <h3 className="text-sm font-semibold mb-2">Message Data</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Context Messages:</span>
                    <Badge variant="outline">{messages.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LocalStorage Messages:</span>
                    <Badge variant="outline">{localStorageData.messages?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages with Images:</span>
                    <Badge variant="outline">{messagesWithImages.length}</Badge>
                  </div>
                </div>
              </div>
              
              {/* Poll summary */}
              <div className="border rounded-md p-3">
                <h3 className="text-sm font-semibold mb-2">Poll Data</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Context Polls:</span>
                    <Badge variant="outline">{polls.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LocalStorage Polls:</span>
                    <Badge variant="outline">{localStorageData.polls?.length || 0}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Debug output */}
            <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="debug-output">
                  <AccordionTrigger>Debug Output</AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-gray-100 p-2 rounded h-40 overflow-y-auto text-xs font-mono">
                      {debugOutput.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="image-messages">
                  <AccordionTrigger>
                    Messages with Images ({messagesWithImages.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-gray-100 p-2 rounded max-h-80 overflow-y-auto text-xs font-mono">
                      <pre>
                        {JSON.stringify(messagesWithImages, null, 2)}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ChatDebugTools; 