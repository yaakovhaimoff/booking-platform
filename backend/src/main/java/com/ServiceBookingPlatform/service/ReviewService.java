package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.ReviewRequest;
import com.ServiceBookingPlatform.dto.ReviewResponse;
import com.ServiceBookingPlatform.dto.ReviewsResponse;
import com.ServiceBookingPlatform.entity.ReviewEntity;
import com.ServiceBookingPlatform.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewsResponse list() {
        List<ReviewEntity> all = reviewRepository.findAllByOrderByCreatedAtDesc();
        double avg = all.stream().mapToInt(ReviewEntity::getRating).average().orElse(0);
        return ReviewsResponse.builder()
                .average(Math.round(avg * 10) / 10.0)
                .count(all.size())
                .reviews(all.stream().map(ReviewResponse::from).toList())
                .build();
    }

    // The author subject comes from the caller's token, never from the request body.
    // A signed-in user has one review per store: posting again replaces the previous one.
    // Guests can post freely (there is nothing to identify them by).
    public ReviewResponse submit(ReviewRequest r, AuthenticatedUser user) {
        ReviewEntity entity = user == null ? new ReviewEntity() : existingReviewOf(user).orElseGet(ReviewEntity::new);
        entity.setAuthorName(r.getAuthorName().trim());
        entity.setAuthorAuth0Sub(user == null ? null : user.subject());
        entity.setAuthorAccountId(user == null ? null : user.accountId());
        entity.setRating(r.getRating());
        entity.setComment(r.getComment() == null || r.getComment().isBlank() ? null : r.getComment().trim());
        entity.setCreatedAt(LocalDateTime.now());
        return ReviewResponse.from(reviewRepository.save(entity));
    }

    private Optional<ReviewEntity> existingReviewOf(AuthenticatedUser user) {
        Optional<ReviewEntity> byAccount = user.accountId() == null ? Optional.empty()
                : reviewRepository.findByAuthorAccountId(user.accountId());
        return byAccount.or(() -> reviewRepository.findByAuthorAuth0Sub(user.subject())
                .filter(review -> review.getAuthorAccountId() == null));
    }
}
