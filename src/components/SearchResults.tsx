import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Document } from '../utils/api';
import { searchDocuments } from '../utils/api';

export default function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get query from URL on mount
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const docs = await searchDocuments(query);
        setResults(docs);
      } catch (err) {
        setError('Failed to fetch search results');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
        </motion.div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-red-500"
        >
          {error}
        </motion.div>
      ) : (
        <AnimatePresence>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((doc) => (
                <motion.a
                  key={doc.id}
                  href={`/docs/${doc.filename.replace('.md', '')}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{doc.title}</h2>
                  <p className="text-gray-600 line-clamp-2">{doc.content}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </motion.a>
              ))}
            </div>
          ) : query && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              No results found for "{query}"
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
} 