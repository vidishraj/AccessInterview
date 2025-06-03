import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Document } from '../utils/api';
import { getDocuments, uploadDocument, deleteDocument } from '../utils/api';

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    if (!file || !token) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await uploadDocument(file, token);
      const { message, ...newDoc } = response;
      setDocuments(prev => [newDoc, ...prev]);
      setSuccess(message || 'File uploaded successfully.');
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
                <p className="text-sm text-gray-500">
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