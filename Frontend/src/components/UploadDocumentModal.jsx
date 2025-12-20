import React, { useState } from 'react'
import { FiX, FiUpload, FiFileText } from 'react-icons/fi'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'
import './UploadDocumentModal.css'

function UploadDocumentModal({ isOpen, onClose, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    visaId: '',
    file: null
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFormData(prev => ({
        ...prev,
        file: file,
        name: prev.name || file.name.split('.')[0] // Auto-fill name if empty
      }))
      setError('')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.file) {
      setError('Please select a file to upload')
      return
    }

    if (!formData.name.trim()) {
      setError('Please enter a document name')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique file path
      const timestamp = Date.now()
      const fileName = `${timestamp}_${formData.file.name}`
      const filePath = `documents/${fileName}`
      const storageRef = ref(storage, filePath)

      // Upload file to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, formData.file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          setError('Failed to upload file. Please try again.')
          setUploading(false)
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            
            // Prepare document data
            const documentData = {
              name: formData.name.trim(),
              type: formData.type || null,
              file_url: downloadURL,
              file_path: filePath,
              size: formatFileSize(formData.file.size),
              visa_id: formData.visaId ? parseInt(formData.visaId) : null,
              description: formData.description || null
            }

            // Call the success callback with document data
            await onUploadSuccess(documentData)

            // Reset form
            setFormData({
              name: '',
              type: '',
              description: '',
              visaId: '',
              file: null
            })
            setUploadProgress(0)
            setUploading(false)
            onClose()
          } catch (error) {
            console.error('Error getting download URL:', error)
            setError('Failed to get file URL. Please try again.')
            setUploading(false)
          }
        }
      )
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload file. Please try again.')
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setFormData({
        name: '',
        type: '',
        description: '',
        visaId: '',
        file: null
      })
      setError('')
      setUploadProgress(0)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Document</h2>
          <button className="modal-close" onClick={handleClose} disabled={uploading}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="file">Select File *</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="file-input"
              />
              <label htmlFor="file" className="file-input-label">
                <FiUpload />
                {formData.file ? formData.file.name : 'Choose a file'}
              </label>
            </div>
            {formData.file && (
              <p className="file-info">
                {formatFileSize(formData.file.size)}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Document Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Passport, Bank Statement"
              disabled={uploading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Document Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              disabled={uploading}
            >
              <option value="">Select type</option>
              <option value="Passport">Passport</option>
              <option value="Bank Statement">Bank Statement</option>
              <option value="Travel Insurance">Travel Insurance</option>
              <option value="Flight Tickets">Flight Tickets</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Educational Certificate">Educational Certificate</option>
              <option value="Work Experience Letter">Work Experience Letter</option>
              <option value="Medical Exam">Medical Exam</option>
              <option value="Police Clearance">Police Clearance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add any additional details about this document..."
              disabled={uploading}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="visaId">Visa Application ID (Optional)</label>
            <input
              type="number"
              id="visaId"
              name="visaId"
              value={formData.visaId}
              onChange={handleInputChange}
              placeholder="Enter visa application ID"
              disabled={uploading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="progress-text">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !formData.file || !formData.name.trim()}
              className="btn-submit"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadDocumentModal
