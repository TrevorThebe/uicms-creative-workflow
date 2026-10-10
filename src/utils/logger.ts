export const logError = (context: string, error: any) => {
  console.error(`[${context}] Error:`, error);
  // In the future, this can be extended to send logs to the server
  // fetch('/api/log', { method: 'POST', body: JSON.stringify({ context, error }) });
};

export const logInfo = (message: string) => {
  console.info(`[INFO] ${message}`);
};
