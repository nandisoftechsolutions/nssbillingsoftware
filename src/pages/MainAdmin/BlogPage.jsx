// src/pages/MainAdmin/BlogPage.jsx - SIMPLIFIED VERSION
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import api from "../../utils/api"; // Only import api, not fetchPublicBlogs
import "./BlogPage.css";

const SITE_ROOT = "https://nssbillingsoftware.vercel.app";

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  // SEO config
  const seoConfig = {
    title: "Nandi Billing Blog – GST Billing, Inventory & Business Insights",
    description:
      "Read high-quality articles on GST billing, inventory management, automation, and small business growth from the Nandi Billing Software team.",
    keywords:
      "GST billing blog, GST India, inventory management, business software, billing software India, SME growth tips",
    canonical: `${SITE_ROOT}/blog${currentPage > 1 ? `?page=${currentPage}` : ""}`,
    ogImage: `${SITE_ROOT}/images/blog-og-image.jpg`,
  };

  // ✅ SIMPLE FETCH FUNCTION - Use the correct endpoint
  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Use the most likely correct endpoint
      const res = await api.get(`/admin/blogs/public`, {
        params: { 
          page: page, 
          limit: 6,
          _t: Date.now()
        }
      });

      console.log("📚 Blog API Response:", res.data);
      
      if (res.data && res.data.success) {
        // Handle your expected response structure
        const blogsData = res.data.data || res.data.blogs || [];
        const totalPagesData = res.data.pagination?.totalPages || res.data.totalPages || 1;
        
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
        setTotalPages(Number(totalPagesData) || 1);
      } else {
        // Alternative response structure
        const blogsData = res.data || [];
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("🚨 Blog Fetch Error:", err);
      
      // Provide user-friendly error message
      let errorMessage = "Failed to load blogs";
      
      if (err.statusCode === 404) {
        errorMessage = "Blog endpoint not found. Please check backend configuration.";
      } else if (err.statusCode === 401 || err.statusCode === 403) {
        errorMessage = "Access denied. Please contact administrator.";
      } else if (!err.response) {
        errorMessage = "Cannot connect to server. Please check if backend is running.";
      }
      
      setError(errorMessage);
      setBlogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Test which endpoint works
  const testBlogEndpoint = async () => {
    const endpoints = [
      '/admin/blogs/public',
      '/blogs/public',
      '/api/admin/blogs/public',
      '/api/blogs/public'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const res = await api.get(endpoint, { params: { page: 1, limit: 1 } });
        console.log(`✅ Working endpoint found: ${endpoint}`, res.data);
        return endpoint;
      } catch (err) {
        console.log(`❌ ${endpoint} failed:`, err.statusCode || err.message);
      }
    }
    return null;
  };

  useEffect(() => {
    const initializeBlogs = async () => {
      // First, test to find the correct endpoint
      const workingEndpoint = await testBlogEndpoint();
      
      if (workingEndpoint) {
        console.log(`🎯 Using endpoint: ${workingEndpoint}`);
        // Use the working endpoint
        try {
          setLoading(true);
          const res = await api.get(workingEndpoint, {
            params: { page: currentPage, limit: 6 }
          });
          
          if (res.data) {
            const blogsData = res.data.data || res.data.blogs || res.data;
            setBlogs(Array.isArray(blogsData) ? blogsData : []);
            setTotalPages(res.data.totalPages || res.data.pagination?.totalPages || 1);
          }
        } catch (err) {
          console.error("Error fetching with working endpoint:", err);
          setError("Failed to load blog posts");
        } finally {
          setLoading(false);
        }
      } else {
        // If no endpoint works, show error
        setError("No working blog endpoint found. Please check backend configuration.");
        setLoading(false);
      }
    };
    
    initializeBlogs();
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  // Error Display Component
  const ErrorDisplay = () => (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Unable to Load Blogs</h3>
      <p>{error}</p>
      
      <div className="troubleshooting">
        <h4>Troubleshooting Steps:</h4>
        <ol>
          <li>Ensure backend server is running on port 6060</li>
          <li>Check if blog routes are properly configured</li>
          <li>Verify the endpoint: <code>/api/admin/blogs/public</code></li>
          <li>Check browser console for detailed errors</li>
        </ol>
      </div>
      
      <div className="error-actions">
        <button 
          onClick={() => fetchBlogs(currentPage)} 
          className="retry-btn"
        >
          Retry Loading
        </button>
        <button 
          onClick={testBlogEndpoint}
          className="test-btn"
        >
          Test Endpoints
        </button>
      </div>
    </div>
  );

  // Empty State
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-icon">📝</div>
      <h3>No Blog Posts Available</h3>
      <p>Check back soon for new articles on GST billing and business management.</p>
      <button 
        onClick={() => fetchBlogs(currentPage)}
        className="retry-btn"
      >
        Check Again
      </button>
    </div>
  );

  // Rest of your component remains the same...
  // [Keep all the existing JSX code from your previous version]

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
        <script type="application/ld+json">
          {JSON.stringify({
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
                url: `${SITE_ROOT}/favicon.ico`,
              },
            },
          })}
        </script>

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
              Expert articles on GST billing, inventory management, automation
              and SME business growth.
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
            ) : error ? (
              <ErrorDisplay />
            ) : blogs.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="blog-listing-grid">
                  {blogs.map((blog, index) => (
                    <React.Fragment key={blog._id || blog.id || index}>
                      <article className="blog-card">
                        <div className="blog-card-image-container">
                          {blog.featuredImage ? (
                            <img
                              src={blog.featuredImage}
                              alt={blog.title || "Blog post"}
                              className="blog-card-image"
                              loading="lazy"
                            />
                          ) : (
                            <div className="blog-card-image-placeholder">
                              <span>Nandi Billing</span>
                            </div>
                          )}

                          <div className="blog-card-badge">
                            {blog.category || blog.tags?.[0] || "General"}
                          </div>
                        </div>

                        <div className="blog-card-content">
                          <div className="blog-card-meta">
                            <span className="blog-author">
                              By {blog.author || "Nandi Billing Team"}
                            </span>
                            <span className="blog-date">
                              {new Date(blog.publishedAt || blog.createdAt || blog.updatedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>

                          <h2 className="blog-card-title">
                            <Link to={`/blog/${blog.slug || blog._id || ''}`}>
                              {blog.title || "Untitled Blog Post"}
                            </Link>
                          </h2>

                          <p className="blog-card-excerpt">
                            {blog.excerpt || blog.description || 
                              "Read this article for insights on business management and GST billing."}
                          </p>

                          <div className="blog-card-cta">
                            <Link
                              to={`/blog/${blog.slug || blog._id || ''}`}
                              className="read-more-btn"
                            >
                              Read More →
                            </Link>
                            <span className="read-time">
                              {blog.readTime || "5"} min read
                            </span>
                          </div>
                        </div>
                      </article>

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

                {totalPages > 1 && (
                  <div className="blog-pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="pagination-btn prev"
                    >
                      ← Previous
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="pagination-btn next"
                    >
                      Next →
                    </button>
                    
                    <div className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </div>
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
              <input 
                type="email" 
                placeholder="Enter your email" 
                required 
              />
              <button type="submit">Subscribe</button>
            </form>
            
            <p className="newsletter-note">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPage;