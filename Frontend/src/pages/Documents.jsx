import React, { useState, useEffect } from 'react'
import { dummyDocuments, dummyVisas } from '../data/dummyData'
import { FiUpload, FiFileText, FiCheckCircle, FiClock, FiX, FiDownload } from 'react-icons/fi'
import { initScrollAnimations } from '../utils/scrollAnimation'
import './Documents.css'

function Documents() {
  const [documents] = useState(dummyDocuments)
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    initScrollAnimations()
  }, [])

  const getVisaName = (visaId) => {
    const visa = dummyVisas.find(v => v.id === visaId)
    return visa ? `${visa.name} - ${visa.country}` : 'Unknown Visa'
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

  const filteredDocuments = selectedFilter === 'all'
    ? documents
    : documents.filter(doc => doc.status === selectedFilter)

  const handleUpload = () => {
    // In a real app, this would open a file picker
    alert('File upload functionality would be implemented here')
  }

  return (
    <div className="documents-page">
      <div className="documents-header">
        <div>
          <h1>Documents</h1>
          <p>Manage and track all your visa application documents</p>
        </div>
        <button onClick={handleUpload} className="btn-upload">
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

      <div className="documents-list">
        {filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <p>No documents found</p>
            <button onClick={handleUpload} className="btn-primary">
              Upload Your First Document
            </button>
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
                  <span className="document-type">{doc.type}</span>
                  <span className="document-separator">•</span>
                  <span className="document-size">{doc.size}</span>
                  <span className="document-separator">•</span>
                  <span className="document-date">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="document-visa">
                  <span className="visa-label">For:</span>
                  <span className="visa-name">{getVisaName(doc.visaId)}</span>
                </div>
              </div>
              <div className="document-actions">
                <div
                  className="status-badge"
                  style={{ color: getStatusColor(doc.status) }}
                >
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </div>
                <button className="action-btn" title="Download">
                  <FiDownload />
                </button>
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
    </div>
  )
}

export default Documents

