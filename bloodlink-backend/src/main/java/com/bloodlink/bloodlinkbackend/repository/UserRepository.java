package com.bloodlink.bloodlinkbackend.repository;

import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.ApprovalStatus;
import com.bloodlink.bloodlinkbackend.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);

    long countByRole(Role role);

    long countByActive(boolean active);

    long countByApprovalStatus(ApprovalStatus approvalStatus);
}
