import { useState } from 'react';
import { motion } from 'framer-motion';

export function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="relative">
        <motion.input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documentation..."
          className="w-full px-6 py-4 text-lg rounded-full border border-gray-200 
                   shadow-lg focus:outline-none focus:ring-2 focus:ring-accent 
                   focus:border-transparent transition-shadow"
          whileFocus={{ scale: 1.01 }}
        />
        <motion.button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 
                   bg-accent text-white rounded-full hover:bg-blue-600 
                   transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Search
        </motion.button>
      </form>
    </motion.div>
  );
} 