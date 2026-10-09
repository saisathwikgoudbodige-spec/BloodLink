package com.bloodlink.bloodlinkbackend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("LocationUtil Haversine Distance Tests")
class LocationUtilTest {

    @Test
    @DisplayName("Distance between identical coordinates is 0.0")
    void testIdenticalCoordinates() {
        Double distance = LocationUtil.calculateDistanceKm(17.3850, 78.4867, 17.3850, 78.4867);
        assertNotNull(distance);
        assertEquals(0.0, distance, 0.001);
    }

    @Test
    @DisplayName("Distance calculation between Hyderabad Charminar and Secunderabad Station (~9.5 km)")
    void testHyderabadLocations() {
        // Charminar: 17.3616, 78.4747
        // Secunderabad Station: 17.4344, 78.5015
        Double distance = LocationUtil.calculateDistanceKm(17.3616, 78.4747, 17.4344, 78.5015);
        assertNotNull(distance);
        assertTrue(distance > 8.0 && distance < 11.0, "Distance should be ~8-11 km, was " + distance);
    }

    @Test
    @DisplayName("Null coordinates return null without exception")
    void testNullCoordinates() {
        assertNull(LocationUtil.calculateDistanceKm(null, 78.4867, 17.3850, 78.4867));
        assertNull(LocationUtil.calculateDistanceKm(17.3850, null, 17.3850, 78.4867));
        assertNull(LocationUtil.calculateDistanceKm(17.3850, 78.4867, null, 78.4867));
        assertNull(LocationUtil.calculateDistanceKm(17.3850, 78.4867, 17.3850, null));
    }
}
