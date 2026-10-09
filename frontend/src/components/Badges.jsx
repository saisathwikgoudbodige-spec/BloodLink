import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = status ? status.toUpperCase() : 'UNKNOWN';
  const classMap = {
    OPEN: 'badge-open',
    MATCHING: 'badge-matching',
    RESPONDED: 'badge-responded',
    FULFILLED: 'badge-fulfilled',
    EXPIRED: 'badge-expired',
    CANCELLED: 'badge-cancelled',
    CLOSED: 'badge-closed',
  };

  const className = classMap[normalized] || 'badge-closed';

  return <span className={`badge ${className}`}>{normalized}</span>;
};

export const UrgencyBadge = ({ urgency }) => {
  const normalized = urgency ? urgency.toUpperCase() : 'NORMAL';
  const classMap = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    NORMAL: 'badge-normal',
  };

  const className = classMap[normalized] || 'badge-normal';

  return (
    <span className={`badge ${className}`}>
      {normalized === 'CRITICAL' && '● '}
      {normalized}
    </span>
  );
};

export const BloodBadge = ({ bloodGroup, size = 'md' }) => {
  const displayMap = {
    O_NEGATIVE: 'O-',
    O_POSITIVE: 'O+',
    A_NEGATIVE: 'A-',
    A_POSITIVE: 'A+',
    B_NEGATIVE: 'B-',
    B_POSITIVE: 'B+',
    AB_NEGATIVE: 'AB-',
    AB_POSITIVE: 'AB+',
  };

  const text = displayMap[bloodGroup] || bloodGroup || '?';
  const className = size === 'sm' ? 'blood-badge blood-badge-sm' : 'blood-badge';

  return (
    <div className={className} title={`Blood Group: ${text}`}>
      {text}
    </div>
  );
};
