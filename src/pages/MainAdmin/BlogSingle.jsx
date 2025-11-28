import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import api from "../../utils/api";
import "./Blogsignal.css";

// Use root site URL (no trailing `/blog`) so we can build canonical/OG correctly
const SITE_ROOT = "https://nssbillingsoftware.vercel.app";

const BlogSingle = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Fetch single blog post
  const fetchBlog = useCallback(async () => {
    try {
      const res = await api.get(`/admin/blogs/public/${slug}`);
      if (res?.data?.success) {
        setBlog(res.data.data);
      } else {
        setBlog(null);
      }
    } catch (err) {
      console.error("Single blog error:", err);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    fetchBlog();
  }, [fetchBlog, slug]);

  const handleImageError = () => setImageError(true);

  if (loading) {
    return (
      <div className="blog-loading-container">
        <div className="blog-loading-spinner" />
        <p>Loading blog post...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-not-found">
        <div className="blog-not-found-content">
          <h2>Blog Post Not Found</h2>
          <p>The blog post you're looking for doesn't exist or has been moved.</p>
          <Link to="/blog" className="blog-back-button">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Build absolute URLs and safe fallbacks
  const postUrl = `${SITE_ROOT}/blog/${blog.slug || slug}`;
  const ogImage = blog.featuredImage
    ? blog.featuredImage.startsWith("http")
      ? blog.featuredImage
      : `${SITE_ROOT}${blog.featuredImage.startsWith("/") ? "" : "/"}${blog.featuredImage}`
    : `${SITE_ROOT}/images/blog-og-default.jpg`;
  const publisherLogo = `${SITE_ROOT}/favicon.ico`;

  // SEO config
  const seoConfig = {
    title: `${blog.title} – Nandi Billing Blog | GST Software Insights`,
    description:
      blog.excerpt ||
      blog.metaDescription ||
      `Learn about ${blog.title} with Nandi Billing Software. Expert insights on GST billing, inventory and business management.`,
    keywords: (blog.tags && blog.tags.join(", ")) || "GST billing, business software, inventory management",
    canonical: postUrl,
    ogImage,
  };

  // Structured data (BlogPosting)
  const generateStructuredData = () => {
    if (!blog) return null;

    const imageArray = [];
    if (blog.featuredImage) {
      imageArray.push(ogImage);
    }

    const sd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.title || seoConfig.title,
      description: blog.excerpt || blog.metaDescription || seoConfig.description,
      image: imageArray.length ? imageArray : [`${SITE_ROOT}/images/blog-default.jpg`],
      author: {
        "@type": "Person",
        name: blog.author || "Nandi Billing Team",
      },
      publisher: {
        "@type": "Organization",
        name: "Nandi Softech Solutions",
        logo: {
          "@type": "ImageObject",
          url: publisherLogo,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": postUrl,
      },
      datePublished: blog.publishedAt || blog.createdAt || undefined,
      dateModified: blog.updatedAt || blog.publishedAt || undefined,
    };

    if (blog.tags && blog.tags.length) {
      sd.keywords = blog.tags.join(", ");
    }

    if (blog.category) {
      sd.articleSection = blog.category;
    }

    if (blog.wordCount) {
      sd.wordCount = blog.wordCount;
    }

    return sd;
  };

  const structuredData = generateStructuredData();

  return (
    <>
      <Helmet>
        {/* Basic Meta */}
        <title>{seoConfig.title}</title>
        <meta name="description" content={seoConfig.description} />
        <meta name="keywords" content={seoConfig.keywords} />
        <meta name="author" content={blog.author || "Nandi Billing Team"} />
        <meta name="robots" content="index, follow" />

        {/* Canonical */}
        <link rel="canonical" href={seoConfig.canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Nandi Billing Software" />
        <meta property="og:title" content={seoConfig.title} />
        <meta property="og:description" content={seoConfig.description} />
        <meta property="og:url" content={seoConfig.canonical} />
        <meta property="og:image" content={seoConfig.ogImage} />
        <meta property="og:locale" content="en_IN" />
        {blog.publishedAt && <meta property="article:published_time" content={blog.publishedAt} />}
        {(blog.updatedAt || blog.publishedAt) && (
          <meta property="article:modified_time" content={blog.updatedAt || blog.publishedAt} />
        )}

        {/* Article tags */}
        {Array.isArray(blog.tags) &&
          blog.tags.map((tag) => (
            tag && <meta key={tag} property="article:tag" content={tag} />
          ))}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoConfig.title} />
        <meta name="twitter:description" content={seoConfig.description} />
        <meta name="twitter:image" content={seoConfig.ogImage} />
        {/* Optional: replace with your twitter handle */}
        <meta name="twitter:site" content="@nandibilling" />
        {blog.author && <meta name="twitter:creator" content={blog.author} />}

        {/* JSON-LD structured data (BlogPosting) */}
        {structuredData && (
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        )}

        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_ROOT,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${SITE_ROOT}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: blog.title,
                item: postUrl,
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="blog-single-page">
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <div className="container">
            <Link to="/" title="Home">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/blog" title="Blog">Blog</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{blog.title}</span>
          </div>
        </nav>

        {/* Header Ad */}
        {blog.adSpaces?.headerAd && (
          <div className="blog-ad blog-ad-header">
            <div className="blog-ad-label">Advertisement</div>
            <div className="blog-ad-content">
              <div className="blog-ad-placeholder">Header Ad Space</div>
            </div>
          </div>
        )}

        <div className="blog-single-container">
          <article
            className="blog-single-article"
            itemScope
            itemType="https://schema.org/BlogPosting"
          >
            <header className="blog-single-header">
              <div className="blog-category-tag">
                <span className="blog-category">{blog.category || "Business"}</span>
              </div>

              <h1 className="blog-single-title" itemProp="headline">{blog.title}</h1>

              <div className="blog-meta-row">
                <div className="blog-author" itemProp="author" itemScope itemType="https://schema.org/Person">
                  <span className="blog-author-avatar">👤</span>
                  <span itemProp="name">{blog.author || "Nandi Billing Team"}</span>
                </div>

                <div className="blog-date">
                  <time
                    itemProp="datePublished"
                    dateTime={blog.publishedAt}
                  >
                    {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>

                <div className="blog-read-time">
                  <span>⏱️ {blog.readTime || 5} min read</span>
                </div>

                <div className="blog-views">
                  <span>👁️ {blog.views || 0} views</span>
                </div>
              </div>

              {blog.featuredImage && !imageError && (
                <div className="blog-image-container">
                  <img
                    src={ogImage}
                    alt={blog.title}
                    className="blog-single-image"
                    itemProp="image"
                    loading="eager"
                    onError={handleImageError}
                  />
                  {blog.imageCaption && (
                    <figcaption className="blog-image-caption">{blog.imageCaption}</figcaption>
                  )}
                </div>
              )}

              {imageError && (
                <div className="blog-image-fallback">
                  <div className="blog-image-placeholder">
                    <span>📝</span>
                    <p>Featured Image</p>
                  </div>
                </div>
              )}
            </header>

            {/* In-content Ad */}
            {blog.adSpaces?.inContentAd && (
              <div className="blog-ad blog-ad-in-content">
                <div className="blog-ad-label">Advertisement</div>
                <div className="blog-ad-content">
                  <div className="blog-ad-placeholder">In-content Ad Space</div>
                </div>
              </div>
            )}

            <div
              className="blog-single-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
              itemProp="articleBody"
            />

            <footer className="blog-single-footer">
              <div className="blog-tags-container">
                <h3>Topics:</h3>
                <div className="blog-tags">
                  {blog.tags?.length ? (
                    blog.tags.map((tag) => (
                      <span key={tag} className="blog-tag" itemProp="keywords">#{tag}</span>
                    ))
                  ) : (
                    <span className="blog-tag">#Business</span>
                  )}
                </div>
              </div>

              <div className="blog-actions">
                <button className="blog-like-btn" aria-label="Like this article">
                  👍 Like ({blog.likes || 0})
                </button>
                <button className="blog-share-btn" aria-label="Share this article">
                  🔗 Share
                </button>
              </div>

              <div className="blog-author-bio">
                <div className="author-avatar">👤</div>
                <div className="author-info">
                  <h4>About the Author</h4>
                  <p>{blog.author || "Nandi Billing Team"} - Expert in GST billing software and business management solutions for Indian SMEs.</p>
                </div>
              </div>
            </footer>
          </article>

          <aside className="blog-single-sidebar">
            {/* Sidebar Ad */}
            {blog.adSpaces?.sidebarAd && (
              <div className="blog-ad blog-ad-sidebar">
                <div className="blog-ad-label">Advertisement</div>
                <div className="blog-ad-content">
                  <div className="blog-ad-placeholder">Sidebar Ad Space</div>
                </div>
              </div>
            )}

            <div className="blog-sidebar-widget">
              <h3>About Nandi Billing</h3>
              <p>Powerful GST billing software designed for Indian small businesses. Streamline your invoicing, inventory, and compliance.</p>
              <Link to="/features" className="sidebar-cta-btn">Explore Features →</Link>
            </div>

            <div className="blog-sidebar-widget">
              <h3>Popular Topics</h3>
              <div className="popular-topics">
                <span className="topic-tag">GST Billing</span>
                <span className="topic-tag">Inventory Management</span>
                <span className="topic-tag">Business Growth</span>
                <span className="topic-tag">Tax Compliance</span>
                <span className="topic-tag">SME Solutions</span>
              </div>
            </div>

            <div className="blog-sidebar-widget">
              <h3>Subscribe to Updates</h3>
              <div className="newsletter-widget">
                <p>Get the latest articles on GST and business management.</p>
                <div className="newsletter-form">
                  <input type="email" placeholder="Your email address" />
                  <button type="submit">Subscribe</button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer Ad */}
        {blog.adSpaces?.footerAd && (
          <div className="blog-ad blog-ad-footer">
            <div className="blog-ad-label">Advertisement</div>
            <div className="blog-ad-content">
              <div className="blog-ad-placeholder">Footer Ad Space</div>
            </div>
          </div>
        )}

        {/* Related Posts Section */}
        <section className="blog-related-posts">
          <div className="container">
            <h2>You Might Also Like</h2>
            <div className="related-posts-grid">
              <div className="related-post-card">
                <div className="related-post-image" />
                <h4>Understanding GST Compliance for Small Businesses</h4>
                <p>Learn how to stay GST compliant with our comprehensive guide.</p>
              </div>
              <div className="related-post-card">
                <div className="related-post-image" />
                <h4>Inventory Management Best Practices</h4>
                <p>Optimize your stock management with these proven strategies.</p>
              </div>
              <div className="related-post-card">
                <div className="related-post-image" />
                <h4>Digital Transformation for Indian SMEs</h4>
                <p>How technology is revolutionizing small business operations.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogSingle;
