import React from 'react'
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import './DeleteConfirmModal.css'

function DeleteConfirmModal({ isOpen, onClose, onConfirm, documentName, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-icon-wrapper">
          <FiAlertTriangle className="delete-modal-icon" />
        </div>
        
        <h2 className="delete-modal-title">Delete Document?</h2>
        
        <p className="delete-modal-message">
          Are you sure you want to delete <strong>"{documentName}"</strong>? 
          This action cannot be undone and the file will be permanently removed.
        </p>

        <div className="delete-modal-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="delete-modal-btn delete-modal-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="delete-modal-btn delete-modal-btn-confirm"
          >
            {isDeleting ? (
              <>
                <span className="delete-spinner"></span>
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 />
                Delete Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
