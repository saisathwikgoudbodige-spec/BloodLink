package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("RequestStatusTransitionService State Machine Tests")
class RequestStatusTransitionServiceTest {

    private RequestStatusTransitionService transitionService;

    @BeforeEach
    void setUp() {
        transitionService = new RequestStatusTransitionService();
    }

    @Test
    @DisplayName("Valid transitions should be allowed")
    void testValidTransitions() {
        assertTrue(transitionService.isTransitionAllowed(RequestStatus.OPEN, RequestStatus.MATCHING));
        assertTrue(transitionService.isTransitionAllowed(RequestStatus.OPEN, RequestStatus.CANCELLED));
        assertTrue(transitionService.isTransitionAllowed(RequestStatus.MATCHING, RequestStatus.RESPONDED));
        assertTrue(transitionService.isTransitionAllowed(RequestStatus.MATCHING, RequestStatus.EXPIRED));
        assertTrue(transitionService.isTransitionAllowed(RequestStatus.RESPONDED, RequestStatus.FULFILLED));
        assertTrue(transitionService.isTransitionAllowed(RequestStatus.FULFILLED, RequestStatus.CLOSED));
    }

    @Test
    @DisplayName("Invalid transitions should be rejected with BadRequestException")
    void testInvalidTransitionsThrowException() {
        // Cannot revert back to OPEN from RESPONDED
        assertThrows(BadRequestException.class, () ->
                transitionService.validateTransition(RequestStatus.RESPONDED, RequestStatus.OPEN));

        // Terminal state EXPIRED cannot transition to OPEN or RESPONDED
        assertThrows(BadRequestException.class, () ->
                transitionService.validateTransition(RequestStatus.EXPIRED, RequestStatus.OPEN));

        // Terminal state CANCELLED cannot transition to any other status
        assertThrows(BadRequestException.class, () ->
                transitionService.validateTransition(RequestStatus.CANCELLED, RequestStatus.MATCHING));

        // Terminal state CLOSED cannot transition
        assertThrows(BadRequestException.class, () ->
                transitionService.validateTransition(RequestStatus.CLOSED, RequestStatus.OPEN));
    }

    @Test
    @DisplayName("Self-transitions return false")
    void testSelfTransition() {
        assertFalse(transitionService.isTransitionAllowed(RequestStatus.OPEN, RequestStatus.OPEN));
        assertFalse(transitionService.isTransitionAllowed(RequestStatus.RESPONDED, RequestStatus.RESPONDED));
    }
}
