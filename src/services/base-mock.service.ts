
// Base class for mock services
export abstract class BaseMockService {
  // Common methods that all mock services might use
  protected delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Simulate random failures to test error handling
  protected simulateRandomFailure(failureRate: number = 0.05): boolean {
    return Math.random() < failureRate;
  }
  
  // Generate a unique ID for new entities
  protected generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
