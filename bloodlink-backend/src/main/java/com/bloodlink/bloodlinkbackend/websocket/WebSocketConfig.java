package com.bloodlink.bloodlinkbackend.websocket;

import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.repository.UserRepository;
import com.bloodlink.bloodlinkbackend.security.CustomUserDetailsService;
import com.bloodlink.bloodlinkbackend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.Optional;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Destination prefixes for messages from the server to clients
        config.enableSimpleBroker("/topic", "/queue", "/user");
        // Prefix for messages sent from client to server
        config.setApplicationDestinationPrefixes("/app");
        // Prefix used for user-specific messaging (e.g., /user/{userId}/queue/notifications)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket and SockJS fallback support
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                // 1. Authenticate STOMP CONNECT using Authorization Bearer token
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        try {
                            String email = jwtService.extractUsername(token);
                            if (email != null) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                                if (jwtService.isTokenValid(token, userDetails)) {
                                    Authentication auth = new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities()
                                    );
                                    accessor.setUser(auth);
                                    log.debug("STOMP connection authenticated for user: {}", email);
                                }
                            }
                        } catch (Exception ex) {
                            log.warn("STOMP authentication token invalid: {}", ex.getMessage());
                        }
                    }
                }

                // 2. Authorize STOMP SUBSCRIBE destinations
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    Principal principal = accessor.getUser();

                    if (destination != null) {
                        // Protect admin topic: must be authenticated and have ROLE_ADMIN
                        if (destination.startsWith("/topic/admin.") || destination.equals("/topic/admin.notifications")) {
                            if (principal == null || !(principal instanceof Authentication auth) ||
                                    auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                                log.warn("Rejected unauthorized subscription attempt to admin topic: {}", destination);
                                throw new AccessDeniedException("Access denied: Administrative privileges required to subscribe to " + destination);
                            }
                        }

                        // Protect user-specific topics: /topic/user.{userId}.notifications
                        if (destination.startsWith("/topic/user.")) {
                            if (principal == null || !(principal instanceof Authentication auth)) {
                                log.warn("Rejected unauthenticated subscription attempt to private topic: {}", destination);
                                throw new AccessDeniedException("Access denied: Authentication required to subscribe to private notifications");
                            }

                            // Extract target userId from topic
                            try {
                                String[] parts = destination.split("\\.");
                                if (parts.length >= 2) {
                                    Long targetUserId = Long.parseLong(parts[1]);
                                    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                                    if (!isAdmin) {
                                        Optional<User> currentUser = userRepository.findByEmail(auth.getName());
                                        if (currentUser.isEmpty() || !currentUser.get().getId().equals(targetUserId)) {
                                            log.warn("User {} attempted unauthorized subscription to topic {}", auth.getName(), destination);
                                            throw new AccessDeniedException("Access denied: You cannot subscribe to another user's private notification channel");
                                        }
                                    }
                                }
                            } catch (NumberFormatException e) {
                                // If format doesn't match ID pattern, deny
                                log.warn("Invalid topic format: {}", destination);
                            }
                        }
                    }
                }

                return message;
            }
        });
    }
}
