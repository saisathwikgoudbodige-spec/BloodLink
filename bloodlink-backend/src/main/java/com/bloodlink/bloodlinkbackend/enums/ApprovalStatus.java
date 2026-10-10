package com.bloodlink.bloodlinkbackend.enums;

/**
 * Status of a user account in the registration-to-approval workflow.
 */
public enum ApprovalStatus {
    /**
     * Account created through public registration; awaiting administrator review.
     * Cannot log in or access protected features.
     */
    PENDING_APPROVAL,

    /**
     * Account reviewed and approved by an administrator.
     * Can authenticate and access role-authorized features.
     */
    APPROVED,

    /**
     * Account registration rejected by an administrator.
     * Cannot authenticate.
     */
    REJECTED
}
