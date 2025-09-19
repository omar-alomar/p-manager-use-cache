'use client';

import { useState } from 'react';

export default function NotificationTestPage() {
  const [assignedUserId, setAssignedUserId] = useState(1);
  const [assignerUserId, setAssignerUserId] = useState(2);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    assignedUserId?: number;
    assignerUserId?: number;
    shouldNotify?: boolean;
    error?: string;
  } | null>(null);

  const testNotification = async (type: 'task_assigned' | 'task_completed') => {
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          assignedUserId,
          assignerUserId,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing notification:', error);
      setResult({ error: 'Failed to test notification' });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Logic Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Assigned User ID (who gets the task):
          </label>
          <input
            type="number"
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(Number(e.target.value))}
            className="border rounded px-3 py-2 w-32"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Assigner User ID (who assigns the task):
          </label>
          <input
            type="number"
            value={assignerUserId}
            onChange={(e) => setAssignerUserId(Number(e.target.value))}
            className="border rounded px-3 py-2 w-32"
          />
        </div>

        <div className="space-x-2">
          <button
            onClick={() => testNotification('task_assigned')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Task Assignment
          </button>
          <button
            onClick={() => testNotification('task_completed')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Task Completion
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 border rounded">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
            <p className="mt-2 text-sm">
              <strong>Should notify:</strong> {result.shouldNotify ? 'Yes' : 'No'} 
              {!result.shouldNotify && ' (same user - no self-notifications)'}
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold mb-2">Test Scenarios:</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Different users (1, 2):</strong> Should notify</li>
            <li><strong>Same user (1, 1):</strong> Should NOT notify (self-assignment/completion)</li>
            <li><strong>Task assignment:</strong> Notifies the assigned user</li>
            <li><strong>Task completion:</strong> Notifies the original assigner</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
