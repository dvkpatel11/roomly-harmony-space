import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2 } from 'lucide-react';
import { getStorageStats, refreshImage, clearAllImages, diagnoseImage } from '../../utils/imageStorage';
import { useChatContext } from '@/contexts/ChatContext';

const ImageDiagnostics: React.FC = () => {
  const { messages } = useChatContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResults, setRefreshResults] = useState<{success: string[], failed: string[]}>({
    success: [],
    failed: []
  });
  const [diagnosticKey, setDiagnosticKey] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [localStorageData, setLocalStorageData] = useState<{
    messages: any[] | null,
    polls: any[] | null,
    households: any[] | null
  }>({
    messages: null,
    polls: null,
    households: null
  });

  // Load stats
  const loadStats = async () => {
    setLoading(true);
    try {
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh all images
  const handleRefreshAll = async () => {
    setRefreshing(true);
    const results = { success: [] as string[], failed: [] as string[] };
    
    try {
      // Find all image messages
      const imageMessages = messages.filter(m => m.image_url?.startsWith('img_'));
      console.log(`Found ${imageMessages.length} image messages to refresh`);
      
      // Refresh each image
      for (const message of imageMessages) {
        if (message.image_url) {
          try {
            await refreshImage(message.image_url);
            results.success.push(message.image_url);
          } catch (error) {
            console.error(`Failed to refresh image ${message.image_url}:`, error);
            results.failed.push(message.image_url);
          }
        }
      }
      
      setRefreshResults(results);
      // Reload stats after refresh
      await loadStats();
    } catch (error) {
      console.error('Error during refresh operation:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Run diagnostic on a specific image
  const handleDiagnoseImage = async () => {
    if (!diagnosticKey || !diagnosticKey.trim()) {
      alert('Please enter a valid image key to diagnose');
      return;
    }
    
    setDiagnosing(true);
    setDiagnosticResult(null);
    
    try {
      const key = diagnosticKey.trim();
      console.log(`Running diagnostics on key: ${key}`);
      
      // Check if the key format is valid
      if (!key.startsWith('img_')) {
        setDiagnosticResult({
          key: key,
          error: 'Invalid key format. Image keys must start with "img_"',
          exists: false,
          inMemory: false,
          inDatabase: false,
          refreshResult: 'failed'
        });
        return;
      }
      
      // Run the diagnostic
      const result = await diagnoseImage(key);
      setDiagnosticResult(result);
      
      // Check in messages
      const messagesWithThisImage = messages.filter(msg => msg.image_url === key);
      if (messagesWithThisImage.length > 0) {
        result.foundInMessages = {
          count: messagesWithThisImage.length,
          messageIds: messagesWithThisImage.map(msg => msg.id)
        };
      }
      
      // Check localStorage too
      try {
        const storedMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        const storedMessagesWithThisImage = storedMessages.filter((msg: any) => msg.image_url === key);
        result.foundInLocalStorage = {
          count: storedMessagesWithThisImage.length,
          messageIds: storedMessagesWithThisImage.map((msg: any) => msg.id)
        };
      } catch (e) {
        result.foundInLocalStorage = { error: 'Failed to check localStorage', count: 0 };
      }
      
      console.log('Diagnostic result:', result);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setDiagnosticResult({ 
        key: diagnosticKey.trim(),
        error: 'Diagnostic failed with an exception: ' + (error instanceof Error ? error.message : String(error)),
        exists: false,
        inMemory: false,
        inDatabase: false, 
        refreshResult: 'failed'
      });
    } finally {
      setDiagnosing(false);
    }
  };

  // Clear all images (dangerous operation)
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear ALL images from storage? This cannot be undone.')) {
      try {
        await clearAllImages();
        await loadStats();
      } catch (error) {
        console.error('Error clearing images:', error);
      }
    }
  };
  
  // Load localStorage data for inspection
  const loadLocalStorageData = () => {
    try {
      const messageData = localStorage.getItem('messages');
      const pollData = localStorage.getItem('polls');
      const householdData = localStorage.getItem('currentHousehold');
      
      setLocalStorageData({
        messages: messageData ? JSON.parse(messageData) : null,
        polls: pollData ? JSON.parse(pollData) : null,
        households: householdData ? JSON.parse(householdData) : null
      });
      
      console.log('Loaded localStorage data');
    } catch (error) {
      console.error('Error loading localStorage data:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadStats();
    loadLocalStorageData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2">Loading storage statistics...</p>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Image Storage Diagnostics</CardTitle>
        <CardDescription>
          Tools to diagnose and fix image storage issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            onClick={loadStats}
            disabled={loading}
            className="flex items-center"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh Stats
          </Button>
          
          <Button
            variant="default"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="flex items-center"
          >
            {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh All Images
          </Button>
          
          <Button
            variant="outline"
            onClick={loadLocalStorageData}
          >
            Check LocalStorage
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleClearAll}
          >
            Clear All Images
          </Button>
        </div>
        
        {/* Diagnostic tools */}
        <div className="mt-4 mb-4 border p-3 rounded-md">
          <h3 className="text-sm font-semibold mb-2">Image Diagnostics</h3>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Enter image key (e.g., img_123456)"
              value={diagnosticKey}
              onChange={(e) => setDiagnosticKey(e.target.value)}
              className="flex-grow"
            />
            <Button
              variant="secondary"
              onClick={handleDiagnoseImage}
              disabled={diagnosing || !diagnosticKey}
              className="flex items-center"
            >
              {diagnosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Diagnose
            </Button>
          </div>
          
          {diagnosticResult && (
            <div className="mt-3 p-3 bg-slate-50 rounded-md text-sm">
              <h4 className="font-semibold mb-1">Diagnostic Results</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-600">Image Key:</span>
                <span className="font-mono">{diagnosticResult.key}</span>
                
                <span className="text-slate-600">Exists:</span>
                <Badge variant={diagnosticResult.exists ? "outline" : "destructive"} className={diagnosticResult.exists ? "bg-green-50 text-green-700 border-green-200" : ""}>
                  {String(diagnosticResult.exists)}
                </Badge>
                
                <span className="text-slate-600">In Memory:</span>
                <Badge variant={diagnosticResult.inMemory ? "outline" : "secondary"} className={diagnosticResult.inMemory ? "bg-blue-50 text-blue-700 border-blue-200" : ""}>
                  {String(diagnosticResult.inMemory)}
                </Badge>
                
                <span className="text-slate-600">In Database:</span>
                <Badge variant={diagnosticResult.inDatabase ? "outline" : "secondary"} className={diagnosticResult.inDatabase ? "bg-purple-50 text-purple-700 border-purple-200" : ""}>
                  {String(diagnosticResult.inDatabase)}
                </Badge>
                
                <span className="text-slate-600">Refresh Result:</span>
                <Badge variant={diagnosticResult.refreshResult === 'success' ? "outline" : "destructive"} className={diagnosticResult.refreshResult === 'success' ? "bg-green-50 text-green-700 border-green-200" : ""}>
                  {diagnosticResult.refreshResult}
                </Badge>
                
                {diagnosticResult.foundInMessages && (
                  <>
                    <span className="text-slate-600">In Current Messages:</span>
                    <span>{diagnosticResult.foundInMessages.count} message(s)</span>
                  </>
                )}
                
                {diagnosticResult.foundInLocalStorage && (
                  <>
                    <span className="text-slate-600">In LocalStorage:</span>
                    <span>{diagnosticResult.foundInLocalStorage.count} message(s)</span>
                  </>
                )}
                
                {diagnosticResult.size && (
                  <>
                    <span className="text-slate-600">Size:</span>
                    <span>{(diagnosticResult.size / 1024).toFixed(2)} KB</span>
                  </>
                )}
                
                {diagnosticResult.error && (
                  <>
                    <span className="text-slate-600">Error:</span>
                    <span className="text-red-600">{diagnosticResult.error}</span>
                  </>
                )}
              </div>
              
              {diagnosticResult.blob && (
                <div className="mt-3">
                  <h4 className="font-semibold mb-1">Image Preview</h4>
                  <div className="max-w-xs mx-auto">
                    <img 
                      src={URL.createObjectURL(diagnosticResult.blob)}
                      alt="Diagnosed image"
                      className="rounded-md border border-slate-200"
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* LocalStorage inspection */}
        <div className="mt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="localstorage">
              <AccordionTrigger>LocalStorage Data</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Messages in LocalStorage: {localStorageData.messages ? localStorageData.messages.length : 0}</h4>
                    <div className="max-h-[150px] overflow-y-auto text-xs">
                      {localStorageData.messages ? (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="messages-with-images">
                            <AccordionTrigger>
                              Messages with Images ({localStorageData.messages.filter((m: any) => m.image_url?.startsWith('img_')).length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <pre className="p-2 bg-slate-100 rounded-md text-xs whitespace-pre-wrap">
                                {JSON.stringify(localStorageData.messages.filter((m: any) => m.image_url?.startsWith('img_')), null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <p>No messages found in localStorage</p>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        {stats && (
          <div className="mt-4 space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="stats">
                <AccordionTrigger>Storage Statistics</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-36">Total Images:</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {stats.totalImages}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="w-36">Total Size:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="w-36">Memory Cache:</span>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {stats.memoryCache.count}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="w-36">DB Initialized:</span>
                      <Badge variant={stats.db.initialized ? "outline" : "destructive"} className={stats.db.initialized ? "bg-green-50 text-green-700 border-green-200" : ""}>
                        {String(stats.db.initialized)}
                      </Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="cache-keys">
                <AccordionTrigger>Memory Cache Keys</AccordionTrigger>
                <AccordionContent>
                  {stats.memoryCache.keys.length > 0 ? (
                    <div className="max-h-[200px] overflow-y-auto">
                      <pre className="p-2 bg-slate-100 rounded-md text-xs dark:bg-slate-900 dark:text-slate-200">
                        {stats.memoryCache.keys.join('\n')}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No images in memory cache</p>
                  )}
                </AccordionContent>
              </AccordionItem>
              
              {(refreshResults.success.length > 0 || refreshResults.failed.length > 0) && (
                <AccordionItem value="refresh-results">
                  <AccordionTrigger>Refresh Results</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="w-36">Successfully refreshed:</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {refreshResults.success.length}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <span className="w-36">Failed to refresh:</span>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {refreshResults.failed.length}
                        </Badge>
                      </div>
                      
                      {refreshResults.failed.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Failed Images:</p>
                          <div className="max-h-[150px] overflow-y-auto">
                            <pre className="p-2 bg-slate-100 rounded-md text-xs dark:bg-slate-900 dark:text-slate-200">
                              {refreshResults.failed.join('\n')}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageDiagnostics; 