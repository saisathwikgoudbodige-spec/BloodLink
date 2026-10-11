package com.bloodlink.bloodlinkbackend.mapper;

import com.bloodlink.bloodlinkbackend.dto.DonorProfileDto;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.ApprovalStatus;
import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.Role;
import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("EntityMapper Unit & Regression Tests")
class EntityMapperTest {

    @Test
    @DisplayName("toUserDto returns null when user entity is null")
    void testToUserDtoNull() {
        assertNull(EntityMapper.toUserDto(null));
    }

    @Test
    @DisplayName("toUserDto maps all scalar fields correctly")
    void testToUserDtoScalarFields() {
        LocalDateTime now = LocalDateTime.now();
        User user = User.builder()
                .id(100L)
                .name("Arun Kumar")
                .email("arun@example.local")
                .phone("+91-9876543210")
                .role(Role.USER)
                .active(true)
                .approvalStatus(ApprovalStatus.APPROVED)
                .rejectionReason(null)
                .approvedAt(now)
                .createdAt(now.minusDays(1))
                .build();

        UserDto dto = EntityMapper.toUserDto(user);

        assertNotNull(dto);
        assertEquals(100L, dto.getId());
        assertEquals("Arun Kumar", dto.getName());
        assertEquals("arun@example.local", dto.getEmail());
        assertEquals("+91-9876543210", dto.getPhone());
        assertEquals(Role.USER, dto.getRole());
        assertTrue(dto.isActive());
        assertEquals(ApprovalStatus.APPROVED, dto.getApprovalStatus());
        assertNull(dto.getRejectionReason());
        assertEquals(now, dto.getApprovedAt());
        assertNull(dto.getApprovedByEmail());
        assertNull(dto.getDonorProfile());
    }

    @Test
    @DisplayName("toUserDto correctly maps initialized approvedBy email")
    void testToUserDtoWithApprovedByInitialized() {
        User admin = User.builder()
                .id(1L)
                .email("admin@bloodlink.local")
                .role(Role.ADMIN)
                .build();

        User user = User.builder()
                .id(200L)
                .name("Kavitha")
                .email("kavitha@example.local")
                .role(Role.USER)
                .approvalStatus(ApprovalStatus.APPROVED)
                .approvedBy(admin)
                .build();

        UserDto dto = EntityMapper.toUserDto(user);

        assertNotNull(dto);
        assertEquals("admin@bloodlink.local", dto.getApprovedByEmail());
    }

    @Test
    @DisplayName("toUserDto survives LazyInitializationException on detached User#1 proxy")
    void testToUserDtoWithLazyApprovedByProxyThrowingException() {
        User lazyAdminProxy = mock(User.class);
        when(lazyAdminProxy.getEmail())
                .thenThrow(new LazyInitializationException("Could not initialize proxy [com.bloodlink.bloodlinkbackend.entity.User#1] - no session"));

        User user = User.builder()
                .id(201L)
                .name("Praveen")
                .email("praveen@example.local")
                .role(Role.USER)
                .approvalStatus(ApprovalStatus.APPROVED)
                .approvedBy(lazyAdminProxy)
                .build();

        // Must not throw LazyInitializationException
        UserDto dto = assertDoesNotThrow(() -> EntityMapper.toUserDto(user));

        assertNotNull(dto);
        assertEquals(201L, dto.getId());
        assertNull(dto.getApprovedByEmail(), "ApprovedByEmail should gracefully be null when proxy has no session");
    }

    @Test
    @DisplayName("toUserDto survives LazyInitializationException on detached DonorProfile proxy")
    void testToUserDtoWithLazyDonorProfileProxyThrowingException() {
        DonorProfile lazyDonorProfileProxy = mock(DonorProfile.class);
        when(lazyDonorProfileProxy.getBloodGroup())
                .thenThrow(new LazyInitializationException("Could not initialize proxy [com.bloodlink.bloodlinkbackend.entity.DonorProfile#10] - no session"));

        User user = User.builder()
                .id(202L)
                .name("Suresh")
                .email("suresh@example.local")
                .role(Role.USER)
                .approvalStatus(ApprovalStatus.APPROVED)
                .donorProfile(lazyDonorProfileProxy)
                .build();

        // Must not throw LazyInitializationException
        UserDto dto = assertDoesNotThrow(() -> EntityMapper.toUserDto(user));

        assertNotNull(dto);
        assertNull(dto.getDonorProfile(), "DonorProfile should gracefully be null when proxy cannot be initialized");
    }

    @Test
    @DisplayName("toDonorProfileDto survives LazyInitializationException on user reference")
    void testToDonorProfileDtoWithLazyUserProxy() {
        User lazyUserProxy = mock(User.class);
        when(lazyUserProxy.getId()).thenReturn(55L);
        when(lazyUserProxy.getName())
                .thenThrow(new LazyInitializationException("Could not initialize proxy [com.bloodlink.bloodlinkbackend.entity.User#55] - no session"));

        DonorProfile profile = DonorProfile.builder()
                .id(10L)
                .user(lazyUserProxy)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .city("Warangal")
                .latitude(17.9689)
                .longitude(79.5941)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build();

        DonorProfileDto dto = assertDoesNotThrow(() -> EntityMapper.toDonorProfileDto(profile));

        assertNotNull(dto);
        assertEquals(10L, dto.getId());
        assertEquals(55L, dto.getUserId());
        assertEquals(BloodGroup.B_POSITIVE, dto.getBloodGroup());
        assertEquals("B+", dto.getBloodGroupLabel());
        assertEquals("Warangal", dto.getCity());
    }
}
