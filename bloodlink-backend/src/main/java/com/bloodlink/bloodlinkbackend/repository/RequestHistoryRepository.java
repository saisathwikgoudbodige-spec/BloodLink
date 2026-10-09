package com.bloodlink.bloodlinkbackend.repository;

import com.bloodlink.bloodlinkbackend.entity.RequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestHistoryRepository extends JpaRepository<RequestHistory, Long> {

    List<RequestHistory> findByRequestIdOrderByChangedAtAsc(Long requestId);
}
