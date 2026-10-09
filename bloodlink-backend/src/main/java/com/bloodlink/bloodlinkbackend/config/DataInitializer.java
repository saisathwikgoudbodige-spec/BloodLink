package com.bloodlink.bloodlinkbackend.config;

import com.bloodlink.bloodlinkbackend.entity.*;
import com.bloodlink.bloodlinkbackend.enums.*;
import com.bloodlink.bloodlinkbackend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Value("${app.seed.demo-data:true}")
    private boolean seedDemoData;

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final MatchRepository matchRepository;
    private final NotificationRepository notificationRepository;
    private final RequestHistoryRepository requestHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!seedDemoData) {
            log.info("Demo data seeding is disabled (SEED_DEMO_DATA=false). Skipping.");
            return;
        }
        try {
            // Seed Admin: admin@bloodlink.local
            seedAdminIfNotExists("System Admin", "admin@bloodlink.local", "Admin123!", "+91-9876543210");
            seedAdminIfNotExists("System Administrator", "admin@bloodlink.org", "AdminPassword123!", "+1-555-0100");

            // Seed Requester: requester@bloodlink.local
            User requester = seedRequesterIfNotExists("Rajesh Sharma", "requester@bloodlink.local", "Requester123!", "+91-9876543211");
            seedRequesterIfNotExists("Sarah Jenkins", "requester@bloodlink.org", "Requester123!", "+1-555-0101");

            // Seed Primary Demo Donor: donor@bloodlink.local (Hyderabad, O+, AVAILABLE)
            DonorProfile demoDonor = seedDonorIfNotExists("Kiran Kumar", "donor@bloodlink.local", "Donor123!", "+91-9876543212",
                    BloodGroup.O_POSITIVE, "Hyderabad", 17.3850, 78.4867, AvailabilityStatus.AVAILABLE);

            // Seed Additional Donors (various groups, availability, and locations)
            DonorProfile oNegDonor = seedDonorIfNotExists("Rohit Verma", "rohit.donor@bloodlink.local", "Donor123!", "+91-9876543213",
                    BloodGroup.O_NEGATIVE, "Hyderabad", 17.4399, 78.4983, AvailabilityStatus.AVAILABLE);

            seedDonorIfNotExists("Priya Patel", "priya.donor@bloodlink.local", "Donor123!", "+91-9876543214",
                    BloodGroup.A_POSITIVE, "Hyderabad", 17.4065, 78.4772, AvailabilityStatus.AVAILABLE);

            seedDonorIfNotExists("Ananya Rao", "ananya.donor@bloodlink.local", "Donor123!", "+91-9876543215",
                    BloodGroup.B_POSITIVE, "Hyderabad", 17.3616, 78.4747, AvailabilityStatus.UNAVAILABLE);

            seedDonorIfNotExists("Vikram Reddy", "vikram.donor@bloodlink.local", "Donor123!", "+91-9876543216",
                    BloodGroup.AB_POSITIVE, "Secunderabad", 17.4399, 78.4983, AvailabilityStatus.AVAILABLE);

            // Legacy demo donors
            seedDonorIfNotExists("Alex Johnson", "alex.donor@bloodlink.org", "Donor123!", "+1-555-0102",
                    BloodGroup.O_NEGATIVE, "New York", 40.7128, -74.0060, AvailabilityStatus.AVAILABLE);
            seedDonorIfNotExists("Maria Garcia", "maria.donor@bloodlink.org", "Donor123!", "+1-555-0103",
                    BloodGroup.A_POSITIVE, "New York", 40.7306, -73.9352, AvailabilityStatus.AVAILABLE);

            // Seed Initial Requests for demonstration (Fulfilled and Expired)
            seedSampleRequests(requester, demoDonor, oNegDonor);

            log.info("DataInitializer completed successfully with demo users and requests.");

        } catch (Exception ex) {
            log.warn("Data seeding encountered non-fatal notice: {}", ex.getMessage());
        }
    }

    private void seedAdminIfNotExists(String name, String email, String password, String phone) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User admin = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .phone(phone)
                    .role(Role.ADMIN)
                    .active(true)
                    .createdAt(LocalDateTime.now().minusDays(30))
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            log.info("Initialized demo ADMIN account: {}", email);
        }
    }

    private User seedRequesterIfNotExists(String name, String email, String password, String phone) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User req = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .phone(phone)
                    .role(Role.REQUESTER)
                    .active(true)
                    .createdAt(LocalDateTime.now().minusDays(15))
                    .updatedAt(LocalDateTime.now())
                    .build();
            User saved = userRepository.save(req);
            log.info("Initialized demo REQUESTER account: {}", email);
            return saved;
        });
    }

    private DonorProfile seedDonorIfNotExists(String name, String email, String password, String phone,
                                              BloodGroup bloodGroup, String city, double lat, double lon,
                                              AvailabilityStatus availability) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            User donorUser = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .phone(phone)
                    .role(Role.DONOR)
                    .active(true)
                    .createdAt(LocalDateTime.now().minusDays(20))
                    .updatedAt(LocalDateTime.now())
                    .build();
            User savedUser = userRepository.save(donorUser);

            DonorProfile profile = DonorProfile.builder()
                    .user(savedUser)
                    .bloodGroup(bloodGroup)
                    .city(city)
                    .latitude(lat)
                    .longitude(lon)
                    .availabilityStatus(availability)
                    .createdAt(LocalDateTime.now().minusDays(20))
                    .updatedAt(LocalDateTime.now())
                    .build();
            DonorProfile savedProfile = donorProfileRepository.save(profile);
            savedUser.setDonorProfile(savedProfile);
            log.info("Initialized demo DONOR account: {} ({}) in {} - {}", email, bloodGroup, city, availability);
            return savedProfile;
        }
        return user.getDonorProfile();
    }

    private void seedSampleRequests(User requester, DonorProfile demoDonor, DonorProfile oNegDonor) {
        if (requester == null || bloodRequestRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Fulfilled historical request
        BloodRequest fulfilledRequest = BloodRequest.builder()
                .requester(requester)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .unitsRequired(2)
                .hospitalName("City Care Hospital")
                .city("Hyderabad")
                .latitude(17.3910)
                .longitude(78.4720)
                .urgency(Urgency.HIGH)
                .expiresAt(now.minusDays(2))
                .status(RequestStatus.FULFILLED)
                .createdAt(now.minusDays(3))
                .updatedAt(now.minusDays(2))
                .build();
        BloodRequest savedFulfilled = bloodRequestRepository.save(fulfilledRequest);

        requestHistoryRepository.save(RequestHistory.builder()
                .request(savedFulfilled)
                .oldStatus(RequestStatus.OPEN)
                .newStatus(RequestStatus.FULFILLED)
                .changedBy(requester)
                .changedAt(now.minusDays(2))
                .reason("Blood units arranged and verified at hospital")
                .build());

        // 2. Expired historical request
        BloodRequest expiredRequest = BloodRequest.builder()
                .requester(requester)
                .bloodGroup(BloodGroup.B_POSITIVE)
                .unitsRequired(1)
                .hospitalName("Apollo Emergency Center")
                .city("Hyderabad")
                .latitude(17.4150)
                .longitude(78.4350)
                .urgency(Urgency.NORMAL)
                .expiresAt(now.minusDays(5))
                .status(RequestStatus.EXPIRED)
                .createdAt(now.minusDays(6))
                .updatedAt(now.minusDays(5))
                .build();
        bloodRequestRepository.save(expiredRequest);

        // 3. Initial welcome notification for requester and donor
        notificationRepository.save(Notification.builder()
                .user(requester)
                .requestId(savedFulfilled.getId())
                .title("Welcome to BloodLink")
                .message("Your account is ready. Create emergency blood requests whenever urgent matching is required.")
                .type(NotificationType.REQUEST_UPDATED)
                .isRead(true)
                .createdAt(now.minusDays(3))
                .build());

        if (demoDonor != null && demoDonor.getUser() != null) {
            notificationRepository.save(Notification.builder()
                    .user(demoDonor.getUser())
                    .requestId(savedFulfilled.getId())
                    .title("Welcome to BloodLink Donor Network")
                    .message("Thank you for registering as a volunteer donor. You will receive real-time alerts when compatible emergencies arise.")
                    .type(NotificationType.NEW_MATCH)
                    .isRead(false)
                    .createdAt(now.minusHours(4))
                    .build());
        }
    }
}
