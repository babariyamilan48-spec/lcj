'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';

const ApiStatusCheck: React.FC = () => {
  const [status, setStatus] = useState<{ [key: string]: string }>({});

  const checkApiEndpoints = async () => {
    const apiBaseUrl = getApiBaseUrl();
    const endpoints = [
      { name: 'Gateway Health', url: `${apiBaseUrl}/health` },
      { name: 'Results Service Direct', url: `${apiBaseUrl}/results-service/health` },
      { name: 'Results Test Endpoint', url: `${apiBaseUrl}/results-service/test` },
      { name: 'Results Service via Gateway', url: `${apiBaseUrl}/results-service/results/1` },
    ];

    const newStatus: { [key: string]: string } = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          newStatus[endpoint.name] = '✅ Online';
        } else {
          newStatus[endpoint.name] = `❌ Error ${response.status}`;
        }
      } catch (error) {
        newStatus[endpoint.name] = '❌ Offline';
      }
    }

    setStatus(newStatus);
  };

  useEffect(() => {
    checkApiEndpoints();
    const interval = setInterval(checkApiEndpoints, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold mb-2">API Status Check</h4>
      <div className="space-y-1 text-sm">
        {Object.entries(status).map(([name, stat]) => (
          <div key={name} className="flex justify-between">
            <span>{name}:</span>
            <span>{stat}</span>
          </div>
        ))}
      </div>
      <button
        onClick={checkApiEndpoints}
        className="mt-2 bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700"
      >
        Refresh Status
      </button>
    </div>
  );
};

export default ApiStatusCheck;
