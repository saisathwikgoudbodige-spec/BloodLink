package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Validates and enforces allowed state machine transitions for Blood Requests.
 */
@Service
public class RequestStatusTransitionService {

    private final Map<RequestStatus, Set<RequestStatus>> allowedTransitions = new EnumMap<>(RequestStatus.class);

    public RequestStatusTransitionService() {
        // OPEN can transition to: MATCHING, CANCELLED, EXPIRED
        allowedTransitions.put(RequestStatus.OPEN, EnumSet.of(
                RequestStatus.MATCHING,
                RequestStatus.CANCELLED,
                RequestStatus.EXPIRED
        ));

        // MATCHING can transition to: RESPONDED, EXPIRED, CANCELLED
        allowedTransitions.put(RequestStatus.MATCHING, EnumSet.of(
                RequestStatus.RESPONDED,
                RequestStatus.EXPIRED,
                RequestStatus.CANCELLED
        ));

        // RESPONDED can transition to: FULFILLED, CLOSED, CANCELLED
        allowedTransitions.put(RequestStatus.RESPONDED, EnumSet.of(
                RequestStatus.FULFILLED,
                RequestStatus.CLOSED,
                RequestStatus.CANCELLED
        ));

        // Terminal states
        allowedTransitions.put(RequestStatus.FULFILLED, EnumSet.of(RequestStatus.CLOSED));
        allowedTransitions.put(RequestStatus.EXPIRED, EnumSet.noneOf(RequestStatus.class));
        allowedTransitions.put(RequestStatus.CANCELLED, EnumSet.noneOf(RequestStatus.class));
        allowedTransitions.put(RequestStatus.CLOSED, EnumSet.noneOf(RequestStatus.class));
    }

    public boolean isTransitionAllowed(RequestStatus currentStatus, RequestStatus newStatus) {
        if (currentStatus == null || newStatus == null || currentStatus == newStatus) {
            return false;
        }
        Set<RequestStatus> targets = allowedTransitions.get(currentStatus);
        return targets != null && targets.contains(newStatus);
    }

    public void validateTransition(RequestStatus currentStatus, RequestStatus newStatus) {
        if (!isTransitionAllowed(currentStatus, newStatus)) {
            throw new BadRequestException(String.format(
                    "Invalid status transition from '%s' to '%s'. Allowed transitions: %s",
                    currentStatus, newStatus,
                    allowedTransitions.getOrDefault(currentStatus, Set.of())
            ));
        }
    }
}
