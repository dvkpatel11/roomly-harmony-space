import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { useChatContext } from '@/contexts/ChatContext';
import { Loader2 } from 'lucide-react';

/**
 * ChatsDebugger component
 * This component helps diagnose and debug issues with chat timeline persistence
 */
const ChatsDebugger: React.FC = () => {
  const { messages, messagesByHousehold, polls, pollsByHousehold } = useChatContext();
  const [localStorageData, setLocalStorageData] = useState<{
    messages: any[] | null,
    polls: any[] | null,
    householdMessages: Record<string, any[]>,
    householdPolls: Record<string, any[]>,
    otherKeys: Record<string, string>
  }>({
    messages: null,
    polls: null,
    householdMessages: {},
    householdPolls: {},
    otherKeys: {}
  });
  const [loading, setLoading] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string[]>([]);
  const [timelineIssues, setTimelineIssues] = useState<string[]>([]);

  // Load all localStorage data
  const loadLocalStorageData = () => {
    setLoading(true);
    addDebugOutput('Loading localStorage data...');
    
    try {
      const messages = localStorage.getItem('roomly_messages_cache');
      const polls = localStorage.getItem('roomly_polls_cache');
      const householdMessages: Record<string, any[]> = {};
      const householdPolls: Record<string, any[]> = {};
      const otherKeys: Record<string, string> = {};
      
      // Scan all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        try {
          if (key.startsWith('roomly_household_messages_')) {
            const householdId = key.replace('roomly_household_messages_', '');
            const data = localStorage.getItem(key);
            if (data) {
              householdMessages[householdId] = JSON.parse(data);
              addDebugOutput(`Found ${householdMessages[householdId].length} messages for household ${householdId}`);
            }
          } else if (key.startsWith('roomly_household_polls_')) {
            const householdId = key.replace('roomly_household_polls_', '');
            const data = localStorage.getItem(key);
            if (data) {
              householdPolls[householdId] = JSON.parse(data);
              addDebugOutput(`Found ${householdPolls[householdId].length} polls for household ${householdId}`);
            }
          } else if (key !== 'roomly_messages_cache' && key !== 'roomly_polls_cache') {
            // Store other keys
            const data = localStorage.getItem(key);
            if (data) {
              otherKeys[key] = data;
            }
          }
        } catch (error) {
          addDebugOutput(`Error parsing ${key}: ${error}`);
        }
      }
      
      setLocalStorageData({
        messages: messages ? JSON.parse(messages).messages : null,
        polls: polls ? JSON.parse(polls).polls : null,
        householdMessages,
        householdPolls,
        otherKeys
      });
      
      // Diagnose timeline issues
      analyzeTimelineIssues(
        messages ? JSON.parse(messages).messages : [], 
        householdMessages
      );
      
      addDebugOutput('Local storage data loaded successfully');
    } catch (error) {
      addDebugOutput(`Error loading localStorage data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTimelineIssues = (globalMessages: any[], householdMessages: Record<string, any[]>) => {
    const issues: string[] = [];
    
    // Check if global message count matches sum of household messages
    const totalHouseholdMessages = Object.values(householdMessages).reduce(
      (total, msgs) => total + msgs.length, 0
    );
    
    if (globalMessages.length !== totalHouseholdMessages) {
      issues.push(`Global message count (${globalMessages.length}) doesn't match sum of household messages (${totalHouseholdMessages})`);
    }
    
    // Check for household IDs that exist in context but not localStorage
    const householdIdsInContext = Object.keys(messagesByHousehold);
    const householdIdsInStorage = Object.keys(householdMessages);
    
    const missingInStorage = householdIdsInContext.filter(id => !householdIdsInStorage.includes(id));
    if (missingInStorage.length > 0) {
      issues.push(`Households in context but missing in localStorage: ${missingInStorage.join(', ')}`);
    }
    
    // Check for duplicate message IDs in the same household
    Object.entries(householdMessages).forEach(([householdId, messages]) => {
      const messageIds = messages.map(m => m.id);
      const uniqueMessageIds = new Set(messageIds);
      
      if (messageIds.length !== uniqueMessageIds.size) {
        issues.push(`Household ${householdId} has ${messageIds.length - uniqueMessageIds.size} duplicate message IDs`);
      }
    });
    
    // Check for messages with missing attributes
    Object.entries(householdMessages).forEach(([householdId, messages]) => {
      const missingAttributes = messages.filter(m => !m.id || !m.content || !m.created_at);
      if (missingAttributes.length > 0) {
        issues.push(`Household ${householdId} has ${missingAttributes.length} messages with missing required attributes`);
      }
    });
    
    setTimelineIssues(issues);
    
    if (issues.length === 0) {
      addDebugOutput('No timeline issues detected');
    } else {
      addDebugOutput(`Found ${issues.length} potential timeline issues`);
    }
  };

  const repairTimeline = async () => {
    setLoading(true);
    addDebugOutput('Attempting to repair timeline...');
    
    try {
      // Get all messages from all households in context
      const allContextMessages = Object.values(messagesByHousehold).flat();
      const allContextPolls = Object.values(pollsByHousehold).flat();
      
      // Create a new global message cache
      const newGlobalMessages = {
        messages: allContextMessages,
        hasMore: false,
        oldestMessageId: allContextMessages.length > 0 ? 
          Math.min(...allContextMessages.map(m => m.id as number)) : null,
        newestMessageId: allContextMessages.length > 0 ?
          Math.max(...allContextMessages.map(m => m.id as number)) : null
      };
      
      // Create a new global poll cache
      const newGlobalPolls = {
        polls: allContextPolls,
        hasMore: false,
        oldestPollId: allContextPolls.length > 0 ?
          Math.min(...allContextPolls.map(p => p.id as number)) : null
      };
      
      // Save to localStorage
      localStorage.setItem('roomly_messages_cache', JSON.stringify(newGlobalMessages));
      localStorage.setItem('roomly_polls_cache', JSON.stringify(newGlobalPolls));
      
      // Also save each household's messages
      Object.entries(messagesByHousehold).forEach(([householdId, messages]) => {
        localStorage.setItem(`roomly_household_messages_${householdId}`, JSON.stringify(messages));
      });
      
      // Save each household's polls
      Object.entries(pollsByHousehold).forEach(([householdId, polls]) => {
        localStorage.setItem(`roomly_household_polls_${householdId}`, JSON.stringify(polls));
      });
      
      addDebugOutput('Timeline repair completed');
      addDebugOutput(`Saved ${allContextMessages.length} messages and ${allContextPolls.length} polls`);
      
      // Reload local storage data to verify
      loadLocalStorageData();
    } catch (error) {
      addDebugOutput(`Error repairing timeline: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  const clearLocalStorage = () => {
    if (window.confirm('Are you sure you want to clear all localStorage data? This cannot be undone.')) {
      try {
        // Only clear Roomly-related data
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('roomly_') || key === 'currentHouseholdId')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        addDebugOutput(`Cleared ${keysToRemove.length} localStorage items`);
        
        // Reload data
        loadLocalStorageData();
      } catch (error) {
        addDebugOutput(`Error clearing localStorage: ${error}`);
      }
    }
  };
  
  const addDebugOutput = (message: string) => {
    setDebugOutput(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  // Initial load
  useEffect(() => {
    loadLocalStorageData();
  }, []);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Chat Timeline Debugger</CardTitle>
        <CardDescription>
          Tools to diagnose and fix chat timeline persistence issues
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
            Refresh Data
          </Button>
          
          <Button
            variant="default"
            onClick={repairTimeline}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Repair Timeline
          </Button>
          
          <Button
            variant="destructive"
            onClick={clearLocalStorage}
            disabled={loading}
          >
            Clear LocalStorage
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Context data summary */}
          <div className="border rounded-md p-3">
            <h3 className="text-sm font-semibold mb-2">Context Data</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Global Messages:</span>
                <Badge variant="outline">{messages.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Global Polls:</span>
                <Badge variant="outline">{polls.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Households:</span>
                <Badge variant="outline">{Object.keys(messagesByHousehold).length}</Badge>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <h4 className="text-xs font-semibold mb-1">Messages by Household</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
              {Object.entries(messagesByHousehold).map(([householdId, msgs]) => (
                <div key={householdId} className="flex justify-between">
                  <span className="text-muted-foreground truncate w-40" title={householdId}>
                    {householdId.substring(0, 8)}...
                  </span>
                  <Badge variant="outline">{msgs.length}</Badge>
                </div>
              ))}
            </div>
          </div>
          
          {/* LocalStorage data summary */}
          <div className="border rounded-md p-3">
            <h3 className="text-sm font-semibold mb-2">LocalStorage Data</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Global Messages:</span>
                <Badge variant="outline">{localStorageData.messages?.length || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Global Polls:</span>
                <Badge variant="outline">{localStorageData.polls?.length || 0}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Households:</span>
                <Badge variant="outline">{Object.keys(localStorageData.householdMessages).length}</Badge>
              </div>
            </div>
            
            <Separator className="my-3" />
            
            <h4 className="text-xs font-semibold mb-1">Messages by Household</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
              {Object.entries(localStorageData.householdMessages).map(([householdId, msgs]) => (
                <div key={householdId} className="flex justify-between">
                  <span className="text-muted-foreground truncate w-40" title={householdId}>
                    {householdId.substring(0, 8)}...
                  </span>
                  <Badge variant="outline">{msgs.length}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Timeline issues */}
        {timelineIssues.length > 0 && (
          <div className="mt-4 border rounded-md p-3 bg-red-50">
            <h3 className="text-sm font-semibold mb-2">Timeline Issues</h3>
            <ul className="list-disc pl-4 text-sm text-red-700 space-y-1">
              {timelineIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        
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
            
            <AccordionItem value="raw-data">
              <AccordionTrigger>Raw LocalStorage Data</AccordionTrigger>
              <AccordionContent>
                <div className="bg-gray-100 p-2 rounded max-h-80 overflow-y-auto text-xs font-mono">
                  <pre>
                    {JSON.stringify(localStorageData, null, 2)}
                  </pre>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatsDebugger; 