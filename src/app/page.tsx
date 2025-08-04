'use client';

import { useState } from 'react';

interface JobResult {
  title: string;
  company_name: string;
  location: string;
  description: string;
  apply_link: string;
  apply_links: {
    link: string;
    source: string;
  }[];
  // Add other fields as per SearchAPI response
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setJobs([]);
    setNextPageToken(null);

    try {
      let searchQuery = query;
      if (location) {
        const locations = location.split(',').map(l => `"${l.trim()}"`).join(' or ');
        searchQuery += ` in ${locations}`;
      }

      const params = new URLSearchParams({
        q: searchQuery,
      });

      if (industry) params.append('industry', industry);

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An unknown error occurred');
        return;
      }

      setJobs(data.jobs || []);
      setNextPageToken(data.pagination?.next_page_token || null);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken) return;

    setLoading(true);
    try {
      let searchQuery = query;
      if (location) {
        const locations = location.split(',').map(l => `"${l.trim()}"`).join(' or ');
        searchQuery += ` in ${locations}`;
      }

      const params = new URLSearchParams({
        q: searchQuery,
        token: nextPageToken,
      });

      if (industry) params.append('industry', industry);

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An unknown error occurred');
        return;
      }

      setJobs(prevJobs => [...prevJobs, ...(data.jobs || [])]);
      setNextPageToken(data.pagination?.next_page_token || null);
    } catch (err) {
      console.error('Failed to fetch more jobs:', err);
      setError('Failed to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (jobs.length === 0) return;

    const headers = ["Title", "Company", "Location", "Description", "Apply Link"];
    for (let i = 1; i <= 20; i++) {
      headers.push(`Optional Link ${i}`);
    }

    const rows = jobs.map(job => {
      const row = [
        `"${(job.title ||'').replace(/"/g, '""')}"`,
        `"${(job.company_name || '').replace(/"/g, '""')}"`,
        `"${(job.location ||'').replace(/"/g, '""')}"`,
        `"${(job.description || '').replace(/"/g, '""')}"`,
        `"${(job.apply_link || '').replace(/"/g, '""')}"`,
      ];

      for (let i = 0; i < 20; i++) {
        if (job.apply_links && job.apply_links[i]) {
          row.push(`"${(job.apply_links[i].link || '').replace(/"/g, '""')}"`);
        } else {
          row.push('""');
        }
      }

      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'job_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Job Search</h1>
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="query" className="block text-gray-700 text-sm font-bold mb-2">{`Job Title/Keywords (e.g., "software engineer past 24 hours"):`}</label>
            <input
              type="text"
              id="query"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">Location (comma-separated):</label>
            <input
              type="text"
              id="location"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="industry" className="block text-gray-700 text-sm font-bold mb-2">Industry:</label>
            <input
              type="text"
              id="industry"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
        {jobs.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Export to CSV
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-2xl mx-auto mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {jobs.length === 0 && !loading && !error && (
          <p className="text-center text-gray-600">No jobs found. Try a different search.</p>
        )}

        {jobs.map((job, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{job.title}</h2>
            <p className="text-gray-600 mb-1"><strong>Company:</strong> {job.company_name}</p>
            <p className="text-gray-600 mb-2"><strong>Location:</strong> {job.location}</p>
            <p className="text-gray-700 text-sm line-clamp-3">{job.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <a
                href={job.apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Apply
              </a>
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                >
                  <span>More ways to apply</span>
                  <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </button>
                {openDropdown === index && (
                  <ul className="absolute text-gray-700 pt-1 shadow-lg w-48 z-10">
                    {job.apply_links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <a
                          href={link.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 block whitespace-no-wrap"
                        >
                          {link.source}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Add more job details as needed */}
          </div>
        ))}

        {nextPageToken && (
          <button
            onClick={handleLoadMore}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-4"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  );
}