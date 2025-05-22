package edu.ucsb.cs156.dining.controllers;

import edu.ucsb.cs156.dining.entities.MenuItem;
import edu.ucsb.cs156.dining.entities.Review;
import edu.ucsb.cs156.dining.entities.User;
import edu.ucsb.cs156.dining.errors.EntityNotFoundException;
import edu.ucsb.cs156.dining.models.CurrentUser;
import edu.ucsb.cs156.dining.models.EditedReview;
import edu.ucsb.cs156.dining.repositories.MenuItemRepository;
import edu.ucsb.cs156.dining.repositories.ReviewRepository;
import edu.ucsb.cs156.dining.statuses.ModerationStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@Tag(name = "Review")
@RequestMapping("/api/reviews")
@RestController
@Slf4j
public class ReviewController extends ApiController {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(IllegalArgumentException ex) {
        Map<String, String> errors = new HashMap<>();
        errors.put("error", ex.getMessage());
        return ResponseEntity.badRequest().body(errors);
    }

    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @Operation(summary = "List all Reviews")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping("/all")
    public Iterable<Review> allReviews() {
        log.info("Attempting to log all reviews");
        Iterable<Review> reviews = reviewRepository.findAll();
        log.info("all reviews found, ", reviews);
        return reviews;
    }

    @Operation(summary = "Create a new review")
    @PreAuthorize("hasRole('ROLE_USER')")
    @PostMapping("/post")
    public Review postReview(
            @Parameter(name = "itemId") @RequestParam long itemId,
            @Parameter(description = "Comments by the reviewer, can be blank") @RequestParam(required = false) String reviewerComments,
            @Parameter(name = "itemsStars") @RequestParam Long itemsStars,
            @Parameter(name = "dateItemServed") @RequestParam("dateItemServed") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateItemServed
    ) throws JsonProcessingException {
        LocalDateTime now = LocalDateTime.now();
        Review review = new Review();
        review.setDateItemServed(dateItemServed);

        if ((reviewerComments != null) && !reviewerComments.trim().isEmpty()) {
            review.setReviewerComments(reviewerComments);
        }

        if (itemsStars < 1 || itemsStars > 5) {
            throw new IllegalArgumentException("Items stars must be between 1 and 5.");
        }

        review.setItemsStars(itemsStars);

        MenuItem reviewedItem = menuItemRepository.findById(itemId).orElseThrow(
                () -> new EntityNotFoundException(MenuItem.class, itemId)
        );
        review.setItem(reviewedItem);
        CurrentUser user = getCurrentUser();
        review.setReviewer(user.getUser());
        log.info("reviews={}", review);
        review = reviewRepository.save(review);
        return review;
    }

    @Operation(summary = "Get all reviews a user has sent: only callable by the user")
    @PreAuthorize("hasRole('ROLE_USER')")
    @GetMapping("/userReviews")
    public Iterable<Review> get_all_review_by_user_id() {
        CurrentUser user = getCurrentUser();
        Iterable<Review> reviews = reviewRepository.findByReviewer(user.getUser());
        return reviews;
    }

    @Operation(summary = "Get an individual review by ID (only accessible by owner or admin)")
    @PreAuthorize("hasRole('ROLE_USER')")
    @GetMapping("/get")
    public Review getReviewById(@RequestParam Long id) {
        Review review = reviewRepository.findById(id).orElseThrow(
            () -> new EntityNotFoundException(Review.class, id)
        );

        User current = getCurrentUser().getUser();

        boolean isOwner = review.getReviewer().getId() == current.getId();
        boolean isAdmin = Boolean.TRUE.equals(current.getAdmin());

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to access this review.");
        }

        return review;
    }

    @Operation(summary = "Edit a review")
    @PreAuthorize("hasRole('ROLE_USER')")
    @PutMapping("/reviewer")
    public Review editReview(@Parameter Long id, @RequestBody @Valid EditedReview incoming) {
        Review oldReview = reviewRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException(Review.class, id)
        );
        User current = getCurrentUser().getUser();
        if (current.getId() != oldReview.getReviewer().getId()) {
            throw new AccessDeniedException("No permission to edit review");
        }

        if (incoming.getItemStars() < 1 || incoming.getItemStars() > 5) {
            throw new IllegalArgumentException("Items stars must be between 1 and 5.");
        } else {
            oldReview.setItemsStars(incoming.getItemStars());
        }

        if (incoming.getReviewerComments() != null && !incoming.getReviewerComments().trim().isEmpty()) {
            oldReview.setReviewerComments(incoming.getReviewerComments());
        } else {
            oldReview.setReviewerComments(null);
        }

        oldReview.setDateItemServed(incoming.getDateItemServed());

        oldReview.setStatus(ModerationStatus.AWAITING_REVIEW);
        oldReview.setModeratorComments(null);

        Review review = reviewRepository.save(oldReview);
        return review;
    }

    @Operation(summary = "Delete a review")
    @PreAuthorize("hasRole('ROLE_USER')")
    @DeleteMapping("/reviewer")
    public Object deleteReview(@Parameter Long id) {
        Review review = reviewRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException(Review.class, id)
        );

        User current = getCurrentUser().getUser();
        if (current.getId() != review.getReviewer().getId() && !current.getAdmin()) {
            throw new AccessDeniedException("No permission to delete review");
        }

        reviewRepository.delete(review);
        return genericMessage("Review with id %s deleted".formatted(id));
    }

    @Operation(summary = "Moderate a review")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PutMapping("/moderate")
    public Review moderateReview(@Parameter Long id, @Parameter ModerationStatus status, @Parameter String moderatorComments) {
        Review review = reviewRepository.findById(id).orElseThrow(
                () -> new EntityNotFoundException(Review.class, id)
        );

        review.setModeratorComments(moderatorComments);
        review.setStatus(status);

        review = reviewRepository.save(review);
        return review;
    }

    @Operation(summary = "See reviews that need moderation")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @GetMapping("/needsmoderation")
    public Iterable<Review> needsmoderation() {
        Iterable<Review> reviewsList = reviewRepository.findByStatus(ModerationStatus.AWAITING_REVIEW);
        return reviewsList;
    }
} 
