export const logError = (context: string, error: any) => {
  console.error(`[${context}] Error:`, error);
  // Send to server
  fetch('/php-backend/api/log_event.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'error', message: context, context: { error: String(error) } })
  }).catch(e => console.error('Failed to log to server', e));
};

export const logInfo = (message: string, context = {}) => {
  console.info(`[INFO] ${message}`, context);
  // Send to server
  fetch('/php-backend/api/log_event.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level: 'info', message, context })
  }).catch(e => console.error('Failed to log to server', e));
};
