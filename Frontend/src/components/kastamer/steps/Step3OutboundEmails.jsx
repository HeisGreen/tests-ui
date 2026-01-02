import React from 'react';
import './Step3OutboundEmails.css';

/**
 * Step 3: Outbound Emails Screen
 * Maps to: on-design.json -> screen_03
 * DNS records table with verification status
 */
function Step3OutboundEmails({ dnsVerified, onUpdate }) {
  const dnsRecords = [
    {
      type: 'TXT',
      name: '@',
      value: 'v=spf1 include:kastamer.com ~all',
      verified: false,
    },
    {
      type: 'CNAME',
      name: 'mail',
      value: 'mail.kastamer.com',
      verified: false,
    },
  ];

  const handleVerify = () => {
    // In a real app, this would trigger a DNS verification check
    onUpdate('dnsVerified', true);
  };

  return (
    <div className="kastamer-step3">
      <div className="kastamer-step3-info">
        <p className="kastamer-step3-description">
          Add these DNS records to your domain to enable outbound emails. Once added, click "Proceed to Verification" to check.
        </p>
      </div>

      <div className="kastamer-step3-dns-table">
        <table className="kastamer-dns-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dnsRecords.map((record, index) => (
              <tr key={index}>
                <td className="kastamer-dns-type">{record.type}</td>
                <td className="kastamer-dns-name">{record.name}</td>
                <td className="kastamer-dns-value">
                  <code>{record.value}</code>
                </td>
                <td className="kastamer-dns-status">
                  <span className={`kastamer-status-badge ${record.verified ? 'verified' : 'not-verified'}`}>
                    {record.verified ? 'Verified' : 'Not Verified'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="kastamer-step3-actions">
        <button
          type="button"
          className="kastamer-btn-black"
          onClick={handleVerify}
        >
          Proceed to Verification
        </button>
      </div>
    </div>
  );
}

export default Step3OutboundEmails;

