package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BloodCompatibilityService Unit Tests")
class BloodCompatibilityServiceTest {

    private BloodCompatibilityService compatibilityService;

    @BeforeEach
    void setUp() {
        compatibilityService = new BloodCompatibilityService();
    }

    @Test
    @DisplayName("O Negative should be compatible donor for all blood groups")
    void testUniversalDonorONegative() {
        for (BloodGroup recipient : BloodGroup.values()) {
            assertTrue(compatibilityService.isCompatible(BloodGroup.O_NEGATIVE, recipient),
                    "O- must be compatible donor for " + recipient);
        }
    }

    @Test
    @DisplayName("AB Positive should be compatible recipient for all blood groups")
    void testUniversalRecipientABPositive() {
        for (BloodGroup donor : BloodGroup.values()) {
            assertTrue(compatibilityService.isCompatible(donor, BloodGroup.AB_POSITIVE),
                    donor + " must be compatible for AB+ recipient");
        }
    }

    @Test
    @DisplayName("O Positive can donate to O+, A+, B+, AB+ but not Rh negative groups")
    void testOPositiveCompatibility() {
        assertTrue(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.O_POSITIVE));
        assertTrue(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.A_POSITIVE));
        assertTrue(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.B_POSITIVE));
        assertTrue(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.AB_POSITIVE));

        assertFalse(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE));
        assertFalse(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.A_NEGATIVE));
        assertFalse(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.B_NEGATIVE));
        assertFalse(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.AB_NEGATIVE));
    }

    @Test
    @DisplayName("Incompatible blood groups return false")
    void testIncompatibleGroups() {
        assertFalse(compatibilityService.isCompatible(BloodGroup.A_POSITIVE, BloodGroup.B_POSITIVE));
        assertFalse(compatibilityService.isCompatible(BloodGroup.B_POSITIVE, BloodGroup.A_POSITIVE));
        assertFalse(compatibilityService.isCompatible(BloodGroup.AB_POSITIVE, BloodGroup.O_POSITIVE));
    }

    @Test
    @DisplayName("Null parameters safely return false or empty sets")
    void testNullHandling() {
        assertFalse(compatibilityService.isCompatible(null, BloodGroup.O_POSITIVE));
        assertFalse(compatibilityService.isCompatible(BloodGroup.O_POSITIVE, null));
        assertTrue(compatibilityService.getCompatibleDonorGroups(null).isEmpty());
        assertTrue(compatibilityService.getCompatibleRecipientGroups(null).isEmpty());
    }

    @Test
    @DisplayName("Compatible donor groups set for O+ recipient should only contain O- and O+")
    void testGetCompatibleDonorGroups() {
        Set<BloodGroup> donorsForOPos = compatibilityService.getCompatibleDonorGroups(BloodGroup.O_POSITIVE);
        assertEquals(2, donorsForOPos.size());
        assertTrue(donorsForOPos.contains(BloodGroup.O_NEGATIVE));
        assertTrue(donorsForOPos.contains(BloodGroup.O_POSITIVE));
    }
}
