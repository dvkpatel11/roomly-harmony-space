import ImageDiagnostics from './ImageDiagnostics';

// ... existing code ...

return (
  <ChatProvider>
    <ImageCacheManager />
    <HouseholdTabs defaultSelectedHousehold={defaultSelectedHousehold} />
    
    {/* Debug tools - only visible in development mode */}
    {process.env.NODE_ENV === 'development' && (
      <Box mt={4} mb={4}>
        <ImageDiagnostics />
      </Box>
    )}
    
    {/* Notifications for chatroom events */}
    <ChatNotifications />
    
    {/* Household Chat Rooms */}
    <Box mt={4} mb={20}>
      {households.map((household) => (
        <ChatRoom
          key={household.id}
          household={household}
          isActive={selectedHousehold === household.id}
        />
      ))}
    </Box>
  </ChatProvider>
); 