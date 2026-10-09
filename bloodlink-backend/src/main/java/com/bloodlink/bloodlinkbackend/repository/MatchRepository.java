package com.bloodlink.bloodlinkbackend.repository;

import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByRequestIdOrderByDistanceKmAsc(Long requestId);

    List<Match> findByDonorIdOrderByCreatedAtDesc(Long donorId);

    List<Match> findByDonorUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Match> findByRequestIdAndDonorId(Long requestId, Long donorId);

    boolean existsByRequestIdAndDonorId(Long requestId, Long donorId);

    long countByResponseStatus(MatchStatus status);

    long countByRequestIdAndResponseStatus(Long requestId, MatchStatus status);
}
