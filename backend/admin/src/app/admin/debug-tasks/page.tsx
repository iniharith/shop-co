
"use client";

import React, { useEffect, useState } from "react";

export default function DebugTasksPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    
    fetch(`${backendUrl}/api/tasks/debug-tasks`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading raw timestamps from database...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Raw Database Task Data (Debug)</h1>
      <p className="mb-4 text-sm text-gray-500">Please copy the entire block below and paste it to the assistant:</p>
      
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[70vh] font-mono text-xs">
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

