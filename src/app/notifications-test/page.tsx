import { NotificationDemo } from '@/components/NotificationDemo';

export default function NotificationsTestPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification System Test</h1>
      <div className="space-y-6">
        <NotificationDemo />
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">How to Test</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Enable demo mode using the button above</li>
            <li>Click &quot;Test Task Assignment&quot; to simulate a task assignment notification</li>
            <li>Click &quot;Test Task Completion&quot; to simulate a task completion notification</li>
            <li>Check the notification bell icon in the top navigation for the notification center</li>
            <li>Look for toast notifications appearing in the top-right corner</li>
          </ol>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Real-world Testing</h2>
          <p className="text-sm text-gray-600 mb-2">
            To test with real data:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Create a new task and assign it to another user</li>
            <li>Have that user mark the task as completed</li>
            <li>Both users should receive appropriate notifications</li>
          </ol>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Features</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Real-time notifications using Server-Sent Events (SSE)</li>
            <li>Toast notifications for immediate feedback</li>
            <li>Notification center with history and unread count</li>
            <li>Click notifications to navigate to relevant tasks</li>
            <li>Connection status indicator</li>
            <li>Auto-dismissing toast notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
