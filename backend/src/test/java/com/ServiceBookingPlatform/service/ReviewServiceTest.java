package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.ReviewRequest;
import com.ServiceBookingPlatform.entity.ReviewEntity;
import com.ServiceBookingPlatform.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    private ReviewRepository repository;
    private ReviewService service;

    @BeforeEach
    void setUp() {
        repository = mock(ReviewRepository.class);
        when(repository.save(any(ReviewEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new ReviewService(repository);
    }

    private static ReviewRequest request(int rating) {
        ReviewRequest request = new ReviewRequest();
        request.setAuthorName(" Ann ");
        request.setRating(rating);
        return request;
    }

    private ReviewEntity saved() {
        ArgumentCaptor<ReviewEntity> captor = ArgumentCaptor.forClass(ReviewEntity.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    private static AuthenticatedUser user(Long accountId) {
        return new AuthenticatedUser("local|9", null, "Ann", "consumer", null, accountId);
    }

    @Test
    void aNewReviewByASignedInUserStoresBothTheAccountIdAndTheOldSubject() {
        when(repository.findByAuthorAccountId(9L)).thenReturn(Optional.empty());
        when(repository.findByAuthorAuth0Sub("local|9")).thenReturn(Optional.empty());

        service.submit(request(5), user(9L));

        ReviewEntity review = saved();
        assertEquals(9L, review.getAuthorAccountId());
        assertEquals("local|9", review.getAuthorAuth0Sub());
        assertEquals("Ann", review.getAuthorName());
    }

    @Test
    void postingAgainReplacesTheUsersOwnReviewFoundByAccountId() {
        ReviewEntity existing = new ReviewEntity();
        existing.setId(4L);
        existing.setAuthorAccountId(9L);
        existing.setCreatedAt(LocalDateTime.now().minusDays(1));
        when(repository.findByAuthorAccountId(9L)).thenReturn(Optional.of(existing));

        service.submit(request(3), user(9L));

        ReviewEntity review = saved();
        assertEquals(4L, review.getId());
        assertEquals(3, review.getRating());
    }

    @Test
    void anOlderReviewWithoutAnAccountIdIsFoundByTheOldSubjectAndGetsTheAccountId() {
        ReviewEntity legacy = new ReviewEntity();
        legacy.setId(2L);
        legacy.setAuthorAuth0Sub("local|9");
        when(repository.findByAuthorAccountId(9L)).thenReturn(Optional.empty());
        when(repository.findByAuthorAuth0Sub("local|9")).thenReturn(Optional.of(legacy));

        service.submit(request(4), user(9L));

        ReviewEntity review = saved();
        assertEquals(2L, review.getId());
        assertEquals(9L, review.getAuthorAccountId());
    }

    @Test
    void anotherAccountsReviewIsNeverReplacedThroughASharedOldSubject() {
        ReviewEntity theirs = new ReviewEntity();
        theirs.setId(3L);
        theirs.setAuthorAuth0Sub("local|9");
        theirs.setAuthorAccountId(1L);
        when(repository.findByAuthorAccountId(9L)).thenReturn(Optional.empty());
        when(repository.findByAuthorAuth0Sub("local|9")).thenReturn(Optional.of(theirs));

        service.submit(request(1), user(9L));

        assertNull(saved().getId(), "a new review is created instead of overwriting the other account's");
    }

    @Test
    void aGuestReviewHasNoAuthorAndNothingIsLookedUp() {
        service.submit(request(5), null);

        ReviewEntity review = saved();
        assertNull(review.getAuthorAccountId());
        assertNull(review.getAuthorAuth0Sub());
        verify(repository, never()).findByAuthorAccountId(any());
        verify(repository, never()).findByAuthorAuth0Sub(any());
    }
}
