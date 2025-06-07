import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Document } from '../utils/api';
import { getDocuments, uploadDocument, deleteDocument } from '../utils/api';

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const token = sessionStorage.getItem('adminToken');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error(err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token || !title.trim()) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (tags.trim()) {
      formData.append('tags', tags.trim());
    }

    try {
      const response = await uploadDocument(formData, token);
      const { message, ...newDoc } = response;
      setDocuments(prev => [newDoc, ...prev]);
      setSuccess(message || 'File uploaded successfully.');
      setTitle('');
      setTags('');
    } catch (err) {
      setError('Failed to upload document');
      setSuccess(null);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;

    try {
      await deleteDocument(id, token);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Document Management</h1>
        <div className="mb-2 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-4 py-2">
          After uploading a document, please wait up to 5 minutes for the changes to take effect in the documentation and search results.
        </div>
        <div className="space-y-4 bg-white p-6 rounded-lg shadow-md">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              placeholder="Enter document title"
              required
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent"
              placeholder="e.g. tutorial, guide, api"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document File (Markdown) *
            </label>
            <div className="flex items-center gap-4">
              <label className="bg-accent text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors cursor-pointer">
                Upload Document
                <input
                  type="file"
                  accept=".md"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              {isUploading && <span className="text-gray-600">Uploading...</span>}
              {error && <span className="text-red-500">{error}</span>}
              {success && <span className="text-green-600">{success}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {documents.map(doc => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{doc.title}</h3>
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {doc.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}