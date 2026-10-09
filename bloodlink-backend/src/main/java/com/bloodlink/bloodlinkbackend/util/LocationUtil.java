package com.bloodlink.bloodlinkbackend.util;

public class LocationUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculates the approximate distance in kilometers between two GPS coordinates using the Haversine formula.
     * Returns null if any coordinate is missing.
     */
    public static Double calculateDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;
        // Round to 1 decimal place
        return Math.round(distance * 10.0) / 10.0;
    }
}
