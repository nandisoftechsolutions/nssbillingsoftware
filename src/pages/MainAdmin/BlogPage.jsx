// src/pages/MainAdmin/BlogPage.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import api from "../../utils/api";
import "./BlogPage.css";

const SITE_ROOT = "https://nssbillingsoftware.vercel.app";

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // SEO config
  const seoConfig = {
    title: "Nandi Billing Blog – GST Billing, Inventory & Business Insights",
    description:
      "Read high-quality articles on GST billing, inventory management, automation, and small business growth from the Nandi Billing Software team.",
    keywords:
      "GST billing blog, GST India, inventory management, business software, billing software India, SME growth tips",
    canonical: `${SITE_ROOT}/blog${currentPage > 1 ? `?page=${currentPage}` : ""}`,
    ogImage: `${SITE_ROOT}/images/blog-og-image.jpg`
  };

  // Fetch blogs from backend
  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);

      const res = await api.get(`/admin/blogs/public?page=${page}&limit=6`);

      if (res.data.success) {
        setBlogs(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Blog fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage]);

  // Dummy AdSense values
  const ADSENSE_CLIENT = "ca-pub-1234567890000000";
  const SLOT_HEADER = "111111_header";
  const SLOT_INGRID = "111111_ingrid";
  const SLOT_FOOTER = "111111_footer";

  // Ad Component
  const AdBlock = ({ position, slot, format = "auto" }) => (
    <div className={`ad-container ad-${position}`}>
      <div className="ad-label">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
      <script>{`(adsbygoogle = window.adsbygoogle || []).push({});`}</script>
    </div>
  );

  // Skeleton Loader
  const BlogSkeleton = () => (
    <div className="blog-listing-grid">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="blog-card skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line medium"></div>
            <div className="skeleton-line long"></div>
            <div className="skeleton-footer">
              <div className="skeleton-line xshort"></div>
              <div className="skeleton-line xshort"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // JSON-LD structured data for blog listing
  const blogListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Nandi Billing Blog",
    url: `${SITE_ROOT}/blog`,
    description: seoConfig.description,
    publisher: {
      "@type": "Organization",
      name: "Nandi Softech Solutions",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ROOT}/favicon.ico`
      }
    },
    mainEntity: {
      "@type": "Blog",
      name: "Nandi Billing Blog",
      blogPost: blogs.map((b) => ({
        "@type": "BlogPosting",
        headline: b.title,
        url: `${SITE_ROOT}/blog/${b.slug}`,
        image: b.featuredImage || `${SITE_ROOT}/images/blog-default.jpg`,
        datePublished: b.publishedAt,
        author: {
          "@type": "Person",
          name: b.author || "Nandi Billing Team"
        }
      }))
    }
  };

  return (
    <>
      <Helmet>
        {/* SEO Core */}
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={seoConfig.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:url" content={seoConfig.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Nandi Billing Software" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter SEO */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        <meta name="twitter:image" content={seoConfig.ogImage} />
        <meta name="twitter:site" content="@nandibilling" />

        {/* Structured Data for Google */}
        <script type="application/ld+json">{JSON.stringify(blogListSchema)}</script>

        {/* AdSense */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        ></script>
      </Helmet>

      <div className="blog-listing-page">
        {/* Header Ad */}
        <AdBlock position="header" slot={SLOT_HEADER} format="horizontal" />

        {/* Header Section */}
        <header className="blog-listing-header">
          <div className="container">
            <h1 className="blog-main-title">Nandi Billing Blog</h1>
            <p className="blog-subtitle">
              Expert articles on GST billing, inventory management, automation and SME business growth.
            </p>

            <div className="blog-stats">
              <span>Trusted by 10,000+ Businesses</span>
              <span>•</span>
              <span>Updated Weekly</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="blog-main-content">
          <div className="container">
            {loading ? (
              <BlogSkeleton />
            ) : (
              <>
                <div className="blog-listing-grid">
                  {blogs.map((blog, index) => (
                    <React.Fragment key={blog._id}>
                      {/* Blog Card */}
                      <article className="blog-card">
                        <div className="blog-card-image-container">
                          {blog.featuredImage ? (
                            <img
                              src={blog.featuredImage}
                              alt={blog.title}
                              className="blog-card-image"
                              loading="lazy"
                            />
                          ) : (
                            <div className="blog-card-image-placeholder">
                              <span>Nandi Billing</span>
                            </div>
                          )}

                          <div className="blog-card-badge">
                            {blog.category || "General"}
                          </div>
                        </div>

                        <div className="blog-card-content">
                          <div className="blog-card-meta">
                            <span className="blog-author">
                              By {blog.author}
                            </span>
                            <span className="blog-date">
                              {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                          </div>

                          <h2 className="blog-card-title">
                            <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                          </h2>

                          <p className="blog-card-excerpt">{blog.excerpt}</p>

                          <div className="blog-card-cta">
                            <Link to={`/blog/${blog.slug}`} className="read-more-btn">
                              Read More →
                            </Link>
                          </div>
                        </div>
                      </article>

                      {/* Mid-grid Ads */}
                      {(index === 1 || index === 3) && (
                        <AdBlock
                          position={`in-grid-${index + 1}`}
                          slot={SLOT_INGRID}
                          format="rectangle"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="blog-pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>

                    <span className="pagination-info">
                      Page {currentPage} / {totalPages}
                    </span>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Footer Ad */}
        <AdBlock position="footer" slot={SLOT_FOOTER} format="horizontal" />

        {/* Newsletter Widget */}
        <section className="blog-newsletter">
          <div className="container">
            <h3>Stay Updated with GST News</h3>
            <p>Receive new blog posts directly to your inbox.</p>

            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPage;
