import React from 'react';
import { AlertCircle } from 'lucide-react';

const DisclaimerBanner = () => {
  return (
    <div className="disclaimer-banner">
      <AlertCircle size={15} style={{ flexShrink: 0, color: '#d97706' }} />
      <span>
        <strong>Medical Notice:</strong> BloodLink is an emergency volunteer coordination system. Matches are potential candidates based on rule-based compatibility. Formal blood typing, serological cross-matching, and medical eligibility must be performed by authorized hospital personnel.
      </span>
    </div>
  );
};

export default DisclaimerBanner;
