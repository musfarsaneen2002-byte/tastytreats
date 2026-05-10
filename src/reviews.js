// Reviews functionality for pages that include a review form/list.

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URLS = [''];
  const reviewForm = document.getElementById('review-form');
  const ratingStars = document.querySelectorAll('#rating-stars .star');
  const ratingInput = document.getElementById('rating');
  const ratingDisplay = document.getElementById('rating-display');
  const formMessage = document.getElementById('form-message');
  const reviewsList = document.getElementById('reviews-list');
  const ratingStarsContainer = document.getElementById('rating-stars');

  if (!reviewsList) {
    return;
  }

  if (reviewForm && ratingInput && ratingDisplay && formMessage && ratingStarsContainer) {
    ratingStars.forEach((star) => {
      star.addEventListener('click', (e) => {
        const rating = e.target.dataset.value;
        ratingInput.value = rating;
        ratingDisplay.textContent = `${rating} / 5 Stars`;

        ratingStars.forEach((s) => {
          s.classList.toggle('active', s.dataset.value <= rating);
        });
      });

      star.addEventListener('mouseover', (e) => {
        const hoverValue = e.target.dataset.value;
        ratingStars.forEach((s) => {
          s.classList.toggle('hover', s.dataset.value <= hoverValue);
        });
      });
    });

    ratingStarsContainer.addEventListener('mouseout', () => {
      ratingStars.forEach((s) => {
        s.classList.remove('hover');
      });
    });

    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('reviewer-name').value.trim();
      const email = document.getElementById('reviewer-email').value.trim();
      const rating = ratingInput.value;
      const reviewText = document.getElementById('review-text').value.trim();

      if (!name || !email || !rating || !reviewText) {
        showMessage('Please fill in all fields and select a rating', 'error');
        return;
      }

      if (rating < 1 || rating > 5) {
        showMessage('Please select a valid rating', 'error');
        return;
      }

      try {
        const response = await apiFetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_name: name,
            user_email: email,
            rating: parseInt(rating, 10),
            review_text: reviewText,
            product_id: null
          })
        });

        const data = await response.json();

        if (response.ok) {
          showMessage('Review submitted successfully! Thank you for your feedback.', 'success');
          reviewForm.reset();
          ratingInput.value = 0;
          ratingDisplay.textContent = 'Select a rating';
          ratingStars.forEach((s) => s.classList.remove('active'));

          setTimeout(() => {
            loadReviews();
          }, 1000);
        } else {
          showMessage(data.error || data.message || 'Failed to submit review', 'error');
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        showMessage('Error submitting review. Please try again.', 'error');
      }
    });
  }

  async function loadReviews() {
    try {
      const response = await apiFetch('/api/reviews');
      const reviews = await response.json();

      if (reviews.length === 0) {
        reviewsList.innerHTML = '<div class="no-reviews-message">No reviews yet. Be the first to share your experience!</div>';
        return;
      }

      reviewsList.innerHTML = '';
      reviews.forEach((review, index) => {
        reviewsList.appendChild(createReviewElement(review, index));
      });
    } catch (error) {
      console.error('Error loading reviews:', error);
      reviewsList.innerHTML = '<div class="loading-message">Error loading reviews</div>';
    }
  }

  function createReviewElement(review, index) {
    const div = document.createElement('div');
    div.className = 'review-card animate-in';
    div.style.animationDelay = `${index * 0.1}s`;

    const starsHTML = '&#9733;'.repeat(review.rating) + '&#9734;'.repeat(5 - review.rating);
    const dateObj = new Date(review.created_at);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    div.innerHTML = `
      <div class="review-header">
        <div class="review-info">
          <h4 class="review-author">${escapeHtml(review.user_name)}</h4>
          <span class="review-date">${formattedDate}</span>
        </div>
        <div class="review-rating">
          <span class="review-stars">${starsHTML}</span>
          <span class="rating-value">${review.rating}/5</span>
        </div>
      </div>
      <p class="review-text">${escapeHtml(review.review_text)}</p>
    `;

    return div;
  }

  function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        formMessage.style.display = 'none';
      }, 4000);
    }
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  async function apiFetch(path, options) {
    let lastError;

    for (const baseUrl of API_BASE_URLS) {
      try {
        const response = await fetch(`${baseUrl}${path}`, options);

        if (response.status !== 404 || baseUrl === API_BASE_URLS[API_BASE_URLS.length - 1]) {
          return response;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('API endpoint not found');
  }

  loadReviews();
});
