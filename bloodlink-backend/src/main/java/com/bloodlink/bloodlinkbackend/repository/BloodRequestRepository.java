package com.bloodlink.bloodlinkbackend.repository;

import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<BloodRequest> findByRequesterEmailOrderByCreatedAtDesc(String email);

    List<BloodRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<BloodRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(RequestStatus status);

    @Query("SELECT r FROM BloodRequest r WHERE r.status IN ('OPEN', 'MATCHING', 'RESPONDED') AND r.expiresAt > :now ORDER BY r.createdAt DESC")
    List<BloodRequest> findActiveRequests(@Param("now") LocalDateTime now);

    @Query("SELECT r FROM BloodRequest r WHERE r.status IN ('OPEN', 'MATCHING') AND r.bloodGroup IN :bloodGroups AND r.expiresAt > :now ORDER BY r.createdAt DESC")
    List<BloodRequest> findMatchingActiveRequests(
            @Param("bloodGroups") Collection<BloodGroup> bloodGroups,
            @Param("now") LocalDateTime now
    );
}
