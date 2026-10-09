package com.bloodlink.bloodlinkbackend.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Blood group classification with compatibility checking rules.
 * NOTE: Compatibility rules here are application-level guidelines for initial matching
 * and MUST be medically verified by laboratory cross-matching before any transfusion.
 */
public enum BloodGroup {
    O_NEGATIVE("O-"),
    O_POSITIVE("O+"),
    A_NEGATIVE("A-"),
    A_POSITIVE("A+"),
    B_NEGATIVE("B-"),
    B_POSITIVE("B+"),
    AB_NEGATIVE("AB-"),
    AB_POSITIVE("AB+");

    private final String label;

    BloodGroup(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * Checks if this donor blood group can donate to the specified recipient blood group.
     */
    public boolean canDonateTo(BloodGroup recipientGroup) {
        if (recipientGroup == null) {
            return false;
        }

        return switch (this) {
            case O_NEGATIVE -> true; // Universal red blood cell donor
            case O_POSITIVE -> EnumSet.of(O_POSITIVE, A_POSITIVE, B_POSITIVE, AB_POSITIVE).contains(recipientGroup);
            case A_NEGATIVE -> EnumSet.of(A_NEGATIVE, A_POSITIVE, AB_NEGATIVE, AB_POSITIVE).contains(recipientGroup);
            case A_POSITIVE -> EnumSet.of(A_POSITIVE, AB_POSITIVE).contains(recipientGroup);
            case B_NEGATIVE -> EnumSet.of(B_NEGATIVE, B_POSITIVE, AB_NEGATIVE, AB_POSITIVE).contains(recipientGroup);
            case B_POSITIVE -> EnumSet.of(B_POSITIVE, AB_POSITIVE).contains(recipientGroup);
            case AB_NEGATIVE -> EnumSet.of(AB_NEGATIVE, AB_POSITIVE).contains(recipientGroup);
            case AB_POSITIVE -> recipientGroup == AB_POSITIVE;
        };
    }

    /**
     * Returns all donor blood groups that are potentially compatible for a recipient with this blood group.
     */
    public Set<BloodGroup> getCompatibleDonorGroups() {
        Set<BloodGroup> compatible = EnumSet.noneOf(BloodGroup.class);
        for (BloodGroup candidate : BloodGroup.values()) {
            if (candidate.canDonateTo(this)) {
                compatible.add(candidate);
            }
        }
        return compatible;
    }
}
