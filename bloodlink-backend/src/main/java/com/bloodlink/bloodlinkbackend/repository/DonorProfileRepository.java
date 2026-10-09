package com.bloodlink.bloodlinkbackend.repository;

import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DonorProfileRepository extends JpaRepository<DonorProfile, Long> {

    Optional<DonorProfile> findByUserId(Long userId);

    Optional<DonorProfile> findByUserEmail(String email);

    List<DonorProfile> findByAvailabilityStatus(AvailabilityStatus status);

    @Query("SELECT d FROM DonorProfile d WHERE d.bloodGroup IN :bloodGroups AND d.availabilityStatus = :status AND d.user.active = true")
    List<DonorProfile> findCompatibleAvailableDonors(
            @Param("bloodGroups") Collection<BloodGroup> bloodGroups,
            @Param("status") AvailabilityStatus status
    );

    long countByAvailabilityStatus(AvailabilityStatus status);
}
