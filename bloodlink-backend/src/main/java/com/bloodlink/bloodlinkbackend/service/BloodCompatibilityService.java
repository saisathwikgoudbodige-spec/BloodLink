package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Dedicated, centralized blood compatibility evaluation service.
 * <p>
 * IMPORTANT MEDICAL LIMITATION:
 * The compatibility rules evaluated by this service are baseline application guidelines
 * intended solely for potential donor identification and volunteer coordination.
 * They MUST NOT be considered a guarantee of biological compatibility.
 * All blood transfusions require formal laboratory blood typing and serological cross-matching
 * by certified healthcare professionals.
 */
@Service
public class BloodCompatibilityService {

    public static final String COMPATIBILITY_DISCLAIMER =
            "Potential Match: Compatible according to configured application rules. Awaiting clinical cross-matching and medical verification.";

    private final Map<BloodGroup, Set<BloodGroup>> compatibleDonorsMap = new EnumMap<>(BloodGroup.class);
    private final Map<BloodGroup, Set<BloodGroup>> compatibleRecipientsMap = new EnumMap<>(BloodGroup.class);

    public BloodCompatibilityService() {
        initializeCompatibilityMatrix();
    }

    private void initializeCompatibilityMatrix() {
        // Red Blood Cell Compatibility Rules:
        // Recipient -> Set of compatible Donors
        compatibleDonorsMap.put(BloodGroup.O_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE));
        compatibleDonorsMap.put(BloodGroup.O_POSITIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE));
        compatibleDonorsMap.put(BloodGroup.A_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE));
        compatibleDonorsMap.put(BloodGroup.A_POSITIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.A_NEGATIVE, BloodGroup.A_POSITIVE));
        compatibleDonorsMap.put(BloodGroup.B_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE));
        compatibleDonorsMap.put(BloodGroup.B_POSITIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE, BloodGroup.B_NEGATIVE, BloodGroup.B_POSITIVE));
        compatibleDonorsMap.put(BloodGroup.AB_NEGATIVE, EnumSet.of(BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE, BloodGroup.B_NEGATIVE, BloodGroup.AB_NEGATIVE));
        compatibleDonorsMap.put(BloodGroup.AB_POSITIVE, EnumSet.allOf(BloodGroup.class)); // Universal recipient

        // Donor -> Set of compatible Recipients
        for (BloodGroup bg : BloodGroup.values()) {
            compatibleRecipientsMap.put(bg, EnumSet.noneOf(BloodGroup.class));
        }

        for (Map.Entry<BloodGroup, Set<BloodGroup>> entry : compatibleDonorsMap.entrySet()) {
            BloodGroup recipient = entry.getKey();
            for (BloodGroup donor : entry.getValue()) {
                compatibleRecipientsMap.get(donor).add(recipient);
            }
        }
    }

    /**
     * Determines whether a donor blood group is potentially compatible with the recipient.
     */
    public boolean isCompatible(BloodGroup donorGroup, BloodGroup recipientGroup) {
        if (donorGroup == null || recipientGroup == null) {
            return false;
        }
        Set<BloodGroup> donors = compatibleDonorsMap.get(recipientGroup);
        return donors != null && donors.contains(donorGroup);
    }

    /**
     * Retrieves all donor blood groups that may potentially donate to the given recipient blood group.
     */
    public Set<BloodGroup> getCompatibleDonorGroups(BloodGroup recipientGroup) {
        if (recipientGroup == null) {
            return Collections.emptySet();
        }
        return Collections.unmodifiableSet(compatibleDonorsMap.getOrDefault(recipientGroup, Collections.emptySet()));
    }

    /**
     * Retrieves all recipient blood groups that may potentially receive from the given donor blood group.
     */
    public Set<BloodGroup> getCompatibleRecipientGroups(BloodGroup donorGroup) {
        if (donorGroup == null) {
            return Collections.emptySet();
        }
        return Collections.unmodifiableSet(compatibleRecipientsMap.getOrDefault(donorGroup, Collections.emptySet()));
    }
}
