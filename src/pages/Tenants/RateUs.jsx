// src/pages/Tenants/RateUs.jsx

import React, { useState } from "react";
import { Helmet } from "react-helmet";
import "./RateUs.css";

function RateUs() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  return (
    <>
      <Helmet>
        <title>Rate Nandi Billing Software</title>
        <meta
          name="description"
          content="Rate and review your experience using Nandi Billing Software"
        />
      </Helmet>

      <div className="rateus-wrapper container py-5">
        <div className="rateus-card mx-auto shadow-lg p-4 rounded-4">

          {/* Title */}
          <h2 className="fw-bold text-center mb-3 text-primary">
            Rate Nandi Billing
          </h2>

          <p className="text-muted text-center mb-4">
            Your feedback helps us build a better billing experience ❤️
          </p>

          {/* Static Tenant Info */}
          <div className="rateus-tenant-info mb-4">
            <h5 className="fw-bold">👤 John Doe</h5>
            <p className="mb-1">
              <strong>Business:</strong> Demo Business Pvt Ltd
            </p>
            <p className="mb-1">
              <strong>Email:</strong> demo@gmail.com
            </p>
          </div>

          {/* Static Existing Review */}
          <div className="alert alert-info text-center">
            <strong>Your Review</strong>
            <hr />

            <div className="mb-1">
              ⭐ 4 / 5
            </div>

            <blockquote className="fst-italic">
              "Great UI and perfect features. Love how easy it is to manage billing."
            </blockquote>

            <p className="small mt-2 text-muted">
              Status: <span className="text-success">Approved</span>
            </p>
          </div>

          {/* Rating Form */}
          <form>
            <label className="fw-semibold mb-2">Your Rating *</label>

            <div className="star-container mb-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <span
                  key={num}
                  className={`star ${rating >= num ? "active" : ""}`}
                  onClick={() => setRating(num)}
                >
                  ★
                </span>
              ))}
            </div>

            <label className="fw-semibold mb-2">Write Your Review *</label>
            <textarea
              className="form-control rounded-3"
              rows="4"
              placeholder="Share your experience with Nandi Billing..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />

            <button
              type="button"
              disabled
              className="btn btn-secondary w-100 fw-bold py-3 mt-4 rounded-3"
            >
              Rating Coming Soon
            </button>

            <p className="text-center text-muted small mt-3">
              ⭐ Full rating feature will be available after next update.
            </p>
          </form>

        </div>
      </div>
    </>
  );
}

export default RateUs;
