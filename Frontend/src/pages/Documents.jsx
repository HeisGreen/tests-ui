import React, { useState, useEffect, useMemo } from 'react'
import { FiUpload, FiFileText, FiCheckCircle, FiClock, FiX, FiDownload, FiTrash2 } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import { documentsAPI } from '../utils/api'
import { supabase } from '../config/firebase'
import UploadDocumentModal from '../components/UploadDocumentModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import './Documents.css'

function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, document: null })

  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError('')
      // Always fetch all documents, we'll filter on the frontend
      const docs = await documentsAPI.getDocuments('all')
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading documents:', err)
      setError('Failed to load documents. Please try again.')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = async (documentData) => {
    try {
      // Create document record in backend
      await documentsAPI.createDocument(documentData)
      // Reload documents
      await loadDocuments()
    } catch (err) {
      console.error('Error creating document:', err)
      throw err // Re-throw to let modal handle the error
    }
  }

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank')
  }

  const handleDeleteClick = (doc) => {
    setDeleteModal({
      isOpen: true,
      document: doc
    })
  }

  const handleDeleteConfirm = async () => {
    const { document } = deleteModal
    if (!document) return

    try {
      setDeletingId(document.id)
      
      // Delete file from Supabase Storage if file path exists
      if (document.file_path) {
        try {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([document.file_path])
          
          if (storageError) {
            console.warn('Error deleting file from storage:', storageError)
            // Continue with database deletion even if storage deletion fails
          }
        } catch (storageErr) {
          console.warn('Error deleting file from storage:', storageErr)
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Delete document record from database
      await documentsAPI.deleteDocument(document.id)
      
      // Close modal and reload documents after successful deletion
      setDeleteModal({ isOpen: false, document: null })
      await loadDocuments()
    } catch (err) {
      console.error('Error deleting document:', err)
      setError('Failed to delete document. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, document: null })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <FiCheckCircle className="status-icon verified" />
      case 'pending':
        return <FiClock className="status-icon pending" />
      case 'rejected':
        return <FiX className="status-icon rejected" />
      default:
        return <FiFileText className="status-icon" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#1ABC9C'
      case 'pending':
        return '#F39C12'
      case 'rejected':
        return '#E74C3C'
      default:
        return '#95A5A6'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    try {
      let date
      if (typeof dateString === 'string') {
        // Handle PostgreSQL datetime format: "2025-12-22 01:14:35.737178+01:00"
        let isoString = dateString.trim()
        
        // Replace first space with T if it exists and T is not present
        if (isoString.includes(' ') && !isoString.includes('T')) {
          isoString = isoString.replace(' ', 'T')
        }
        
        // Try parsing
        date = new Date(isoString)
        
        // If still invalid, try removing microseconds (everything after the dot before timezone)
        if (isNaN(date.getTime()) && isoString.includes('.')) {
          // Format: "2025-12-22T01:14:35.737178+01:00" -> "2025-12-22T01:14:35+01:00"
          const parts = isoString.split('.')
          if (parts.length > 1) {
            const beforeDot = parts[0]
            const afterDot = parts[1]
            // Find timezone offset (starts with + or -)
            const tzMatch = afterDot.match(/^[\d]+([+-]\d{2}:\d{2})/)
            if (tzMatch) {
              isoString = beforeDot + tzMatch[1]
              date = new Date(isoString)
            }
          }
        }
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', dateString)
        return 'Invalid date'
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Invalid date'
    }
  }

  const filteredDocuments = useMemo(() => {
    if (selectedFilter === 'all') {
      return documents
    }
    const filtered = documents.filter(doc => {
      // Case-insensitive status matching
      const docStatus = doc.status?.toLowerCase() || ''
      const filterStatus = selectedFilter.toLowerCase()
      const matches = docStatus === filterStatus
      return matches
    })
    console.log('Filtering documents:', {
      selectedFilter,
      totalDocuments: documents.length,
      filteredCount: filtered.length,
      documentStatuses: documents.map(d => d.status)
    })
    return filtered
  }, [documents, selectedFilter])

  useEffect(() => {
    loadDocuments()
  }, []) // Only load once on mount

  useEffect(() => {
    initScrollAnimations()
  }, [filteredDocuments]) // Re-init animations when filtered documents change

  return (
    <div className="documents-page">
      <div className="documents-header">
        <div>
          <h1>Documents</h1>
          <p>Manage and track all your visa application documents</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-upload">
          <FiUpload />
          Upload Document
        </button>
      </div>

      <div className="documents-stats">
        <div className="stat-card scroll-animate scroll-animate-delay-1">
          <div className="stat-value">{documents.length}</div>
          <div className="stat-label">Total Documents</div>
        </div>
        <div className="stat-card scroll-animate scroll-animate-delay-2">
          <div className="stat-value">
            {documents.filter(d => d.status === 'verified').length}
          </div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card scroll-animate scroll-animate-delay-3">
          <div className="stat-value">
            {documents.filter(d => d.status === 'pending').length}
          </div>
          <div className="stat-label">Pending Review</div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All Documents
          </button>
          <button
            className={`filter-btn ${selectedFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('verified')}
          >
            Verified
          </button>
          <button
            className={`filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('pending')}
          >
            Pending
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="documents-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state animated">
            <div className="empty-icon-wrapper">
              <FiFileText className="empty-icon" />
            </div>
            <h3>
              {selectedFilter === 'all' 
                ? 'No documents yet' 
                : `No ${selectedFilter} documents`}
            </h3>
            <p>
              {selectedFilter === 'all' 
                ? 'Start by uploading your first document to get started with your visa application.'
                : `You don't have any ${selectedFilter} documents. Try selecting a different filter or upload a new document.`}
            </p>
            {selectedFilter === 'all' && (
              <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                <FiUpload />
                Upload Your First Document
              </button>
            )}
            {selectedFilter !== 'all' && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={() => setSelectedFilter('all')} 
                  className="btn-primary"
                >
                  View All Documents
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)} 
                  className="btn-primary"
                >
                  <FiUpload />
                  Upload Document
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredDocuments.map((doc, index) => (
            <div key={doc.id} className={`document-card scroll-animate scroll-animate-delay-${(index % 4) + 1}`}>
              <div className="document-icon">
                {getStatusIcon(doc.status)}
              </div>
              <div className="document-info">
                <h3>{doc.name}</h3>
                <div className="document-meta">
                  {doc.type && (
                    <>
                      <span className="document-type">{doc.type}</span>
                      <span className="document-separator">•</span>
                    </>
                  )}
                  {doc.size && (
                    <>
                      <span className="document-size">{doc.size}</span>
                      <span className="document-separator">•</span>
                    </>
                  )}
                  <span className="document-date">
                    Uploaded {formatDate(doc.uploaded_at)}
                  </span>
                </div>
                {doc.description && (
                  <p className="document-description">{doc.description}</p>
                )}
              </div>
              <div className="document-actions">
                <div
                  className="status-badge"
                  style={{ color: getStatusColor(doc.status) }}
                >
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="action-btn" 
                    title="Download"
                    onClick={() => handleDownload(doc.file_url)}
                  >
                    <FiDownload />
                  </button>
                  <button 
                    className="action-btn action-btn-delete" 
                    title="Delete"
                    onClick={() => handleDeleteClick(doc)}
                    disabled={deletingId === doc.id}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="upload-tips">
        <h3>Document Upload Tips</h3>
        <ul>
          <li>Ensure all documents are clear and legible</li>
          <li>Upload documents in PDF format when possible</li>
          <li>Make sure file sizes are under 10MB</li>
          <li>Keep original documents safe after uploading</li>
          <li>Documents are typically reviewed within 2-3 business days</li>
        </ul>
      </div>

      <UploadDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        documentName={deleteModal.document?.name || ''}
        isDeleting={deletingId === deleteModal.document?.id}
      />
    </div>
  )
}

export default Documents
