import React from 'react';
import { useReportDownload } from '../hooks/useResultsService';

interface DownloadReportButtonProps {
  userId: number;
  format?: 'pdf' | 'json' | 'csv';
  includeAiInsights?: boolean;
  testId?: string;
  className?: string;
  children?: React.ReactNode;
}

export const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
  userId,
  format = 'pdf',
  includeAiInsights = true,
  testId,
  className = '',
  children
}) => {
  const { downloading, error, downloadReport } = useReportDownload();

  const handleDownload = async () => {
    try {
      await downloadReport(userId, format, includeAiInsights, testId);
    } catch (err) {
      console.error('Download failed:', err);
      // Error is already handled by the hook
    }
  };

  return (
    <div className="download-report-container">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`download-report-btn ${className} ${downloading ? 'downloading' : ''}`}
        type="button"
      >
        {downloading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating {format.toUpperCase()}...
          </span>
        ) : (
          children || `Download ${format.toUpperCase()} Report`
        )}
      </button>
      
      {error && (
        <div className="error-message mt-2 text-red-600 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};

// Example usage component
export const ReportDownloadExample: React.FC<{ userId: number }> = ({ userId }) => {
  return (
    <div className="report-download-section p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Download Your Reports</h3>
      
      <div className="flex flex-wrap gap-3">
        {/* PDF Report with AI Insights */}
        <DownloadReportButton
          userId={userId}
          format="pdf"
          includeAiInsights={true}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          📄 Download PDF Report
        </DownloadReportButton>

        {/* CSV Report without AI Insights */}
        <DownloadReportButton
          userId={userId}
          format="csv"
          includeAiInsights={false}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          📊 Download CSV Data
        </DownloadReportButton>

        {/* JSON Report with AI Insights */}
        <DownloadReportButton
          userId={userId}
          format="json"
          includeAiInsights={true}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          🔧 Download JSON Report
        </DownloadReportButton>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>PDF:</strong> Complete formatted report with charts and insights</p>
        <p><strong>CSV:</strong> Raw data for spreadsheet analysis</p>
        <p><strong>JSON:</strong> Structured data for developers</p>
      </div>
    </div>
  );
};

export default DownloadReportButton;
