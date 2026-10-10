package com.bloodlink.bloodlinkbackend.repository;

import com.bloodlink.bloodlinkbackend.entity.Notification;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserEmailOrderByCreatedAtDesc(String email);

    long countByUserIdAndIsReadFalse(Long userId);

    long countByUserEmailAndIsReadFalse(String email);

    boolean existsByUserIdAndRequestIdAndType(Long userId, Long requestId, NotificationType type);
}
