// src/pages/Admin/AdminBlogs.jsx
// ------------------------------
// PART 1 of 2
// Optimized AdminBlogs with lazy-loaded editor (Mixed Theme ready)
// ------------------------------

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../utils/api";
import "./AdminBlogs.css";

/**
 * IMPORTANT: We lazy-load the Jodit editor to reduce initial bundle size.
 * - Jodit will be imported only when the create/edit form is opened.
 * - Its CSS is also dynamically imported.
 */
const LazyJoditEditor = React.lazy(() => import("jodit-react"));

/* -------------------------
   Helper small components
   ------------------------- */

const SmallStatCard = ({ number, label }) => (
  <div className="admin-blogs-stat-card">
    <div className="stat-number">{number}</div>
    <div className="stat-label">{label}</div>
  </div>
);

/* -------------------------
   Main Component (Part 1)
   ------------------------- */

const AdminBlogs = () => {
  // Data states
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editorMode, setEditorMode] = useState("design");

  // Editor dynamic loading flags
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    author: "Admin",
    tags: "",
    category: "General",
    metaTitle: "",
    metaDescription: "",
    status: "draft",
    isFeatured: false,
    adSpaces: {
      headerAd: true,
      sidebarAd: true,
      inContentAd: true,
      footerAd: true,
    },
  });

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const navigate = useNavigate();

  const categories = useMemo(
    () => ["General", "Technology", "Business", "Lifestyle", "Health", "Education"],
    []
  );
  const statusOptions = useMemo(() => ["draft", "published", "archived"], []);

  const adsEnabledCount = useMemo(() => {
    return blogs.filter((blog) => {
      const a = blog.adSpaces || {};
      return a.headerAd || a.sidebarAd || a.inContentAd || a.footerAd;
    }).length;
  }, [blogs]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* -------------------------
     Fetch data (blogs + stats)
     ------------------------- */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params more defensively
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const [blogsRes, statsRes] = await Promise.all([
        api.get(`/admin/blogs?${params.toString()}`),
        api.get("/admin/blogs/stats"),
      ]);

      if (blogsRes.data?.success) {
        setBlogs(blogsRes.data.data || []);
      } else {
        setBlogs([]);
      }

      if (statsRes.data?.success && statsRes.data.data) {
        setStats((prev) => ({ ...prev, ...statsRes.data.data }));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      // keep alerts unobtrusive in admin; you can change to toast later
      alert(err?.response?.data?.message || "Failed to fetch blog data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------------------------
     Lazy-load editor CSS when form opens
     ------------------------- */
  useEffect(() => {
    if (showForm && !editorLoaded) {
      // Dynamically import editor CSS so it's not in initial bundle
      import("jodit/es5/jodit.min.css")
        .then(() => {
          setEditorLoaded(true);
        })
        .catch((err) => {
          console.warn("Failed to load Jodit CSS:", err);
          setEditorLoaded(true); // still allow lazy editor import attempt
        });
    }
  }, [showForm, editorLoaded]);

  /* -------------------------
     Form handlers
     ------------------------- */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name && name.startsWith("adSpaces.")) {
      const adSpace = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        adSpaces: {
          ...prev.adSpaces,
          [adSpace]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const toggleAllAds = (enabled) => {
    setFormData((prev) => ({
      ...prev,
      adSpaces: {
        headerAd: enabled,
        sidebarAd: enabled,
        inContentAd: enabled,
        footerAd: enabled,
      },
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      featuredImage: "",
      author: "Admin",
      tags: "",
      category: "General",
      metaTitle: "",
      metaDescription: "",
      status: "draft",
      isFeatured: false,
      adSpaces: {
        headerAd: true,
        sidebarAd: true,
        inContentAd: true,
        footerAd: true,
      },
    });
    setEditingId(null);
    setShowForm(false);
    setEditorMode("design");
  };

  const handleEdit = (blog) => {
    const safeAdSpaces = blog.adSpaces || {
      headerAd: true,
      sidebarAd: true,
      inContentAd: true,
      footerAd: true,
    };

    setFormData({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      featuredImage: blog.featuredImage || "",
      author: blog.author || "Admin",
      tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : "",
      category: blog.category || "General",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      status: blog.status || "draft",
      isFeatured: Boolean(blog.isFeatured),
      adSpaces: {
        headerAd: !!safeAdSpaces.headerAd,
        sidebarAd: !!safeAdSpaces.sidebarAd,
        inContentAd: !!safeAdSpaces.inContentAd,
        footerAd: !!safeAdSpaces.footerAd,
      },
    });

    // open form and lazy-load editor
    setEditingId(blog._id);
    setShowForm(true);
    setEditorMode("design");
  };

  /* -------------------------
     Submit handler (create/update)
     ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      let response;
      if (editingId) {
        response = await api.put(`/admin/blogs/${editingId}`, submitData);
      } else {
        response = await api.post("/admin/blogs", submitData);
      }

      if (response?.data?.success) {
        alert(editingId ? "Blog updated successfully!" : "Blog created!");
        resetForm();
        fetchData();
      } else {
        alert("Failed to save blog");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert(err?.response?.data?.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     Delete & status toggle
     ------------------------- */
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}" ?`)) return;

    try {
      const res = await api.delete(`/admin/blogs/${id}`);
      if (res.data?.success) {
        alert("Blog deleted!");
        fetchData();
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.response?.data?.message || "Delete error");
    }
  };

  const toggleStatus = async (blog, newStatus) => {
    try {
      const res = await api.put(`/admin/blogs/${blog._id}`, { status: newStatus });
      if (res.data?.success) {
        alert(`Blog ${newStatus} successfully!`);
        fetchData();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      alert(err?.response?.data?.message || "Update error");
    }
  };

  /* -------------------------
     End of PART 1
     (Next message contains the JSX render + smaller subcomponents for table & form UI + export)
     ------------------------- */
/* -------------------------
   PART 2 — JSX Render + Final Export
   ------------------------- */

  return (
    <div className="admin-blogs-layout">
      <AdminSidebar />

      <main className="admin-blogs-main">
        {/* Header */}
        <header className="admin-blogs-header">
          <div className="admin-blogs-header-content">
            <div className="admin-blogs-header-text">
              <h1 className="admin-blogs-title">Blog Management</h1>
              <p className="admin-blogs-subtitle">
                Write, edit & manage your blog posts
              </p>
            </div>

            <button
              className="admin-blogs-new-btn"
              onClick={() => setShowForm(true)}
            >
              <span className="btn-icon">+</span>
              New Blog Post
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="admin-blogs-stats">
          <SmallStatCard number={stats.total} label="Total Posts" />
          <SmallStatCard number={stats.published} label="Published" />
          <SmallStatCard number={stats.totalViews} label="Total Views" />
          <SmallStatCard number={stats.totalLikes} label="Total Likes" />
          <SmallStatCard number={adsEnabledCount} label="Ads Enabled" />
        </div>

        {/* Filters */}
        <div className="admin-blogs-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search blogs..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Blog Form Modal */}
        {showForm && (
          <div className="admin-blogs-form-modal">
            <div className="admin-blogs-form-content">
              <div className="admin-blogs-form-header">
                <h3>{editingId ? "Edit Blog Post" : "Create New Blog Post"}</h3>

                <button
                  className="admin-blogs-form-close"
                  onClick={resetForm}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="admin-blogs-form">
                <div className="admin-blogs-form-grid">

                  {/* Title */}
                  <div className="admin-blogs-form-group full-width">
                    <label>Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="admin-blogs-form-group full-width">
                    <label>Excerpt *</label>
                    <textarea
                      rows="3"
                      name="excerpt"
                      required
                      value={formData.excerpt}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Content (Lazy Loaded Editor) */}
                  <div className="admin-blogs-form-group full-width">
                    <label>Content *</label>

                    <div className="editor-mode-toggle">
                      <button
                        type="button"
                        className={`mode-btn ${
                          editorMode === "design" ? "active" : ""
                        }`}
                        onClick={() => setEditorMode("design")}
                      >
                        Design Mode
                      </button>

                      <button
                        type="button"
                        className={`mode-btn ${
                          editorMode === "html" ? "active" : ""
                        }`}
                        onClick={() => setEditorMode("html")}
                      >
                        HTML Mode
                      </button>
                    </div>

                    {/* DESIGN MODE */}
                    {editorMode === "design" ? (
                      <div className="editor-container">
                        {editorLoaded ? (
                          <Suspense fallback={<div>Loading editor...</div>}>
                            <LazyJoditEditor
                              ref={editorRef}
                              value={formData.content}
                              onChange={(newContent) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  content: newContent,
                                }))
                              }
                            />
                          </Suspense>
                        ) : (
                          <div className="loading-state">
                            <div className="loading-spinner large"></div>
                            <p>Loading editor…</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* HTML MODE */
                      <textarea
                        className="html-editor-box"
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        rows="12"
                      />
                    )}
                  </div>

                  {/* Featured Image */}
                  <div className="admin-blogs-form-group">
                    <label>Featured Image URL</label>
                    <input
                      type="text"
                      name="featuredImage"
                      value={formData.featuredImage}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Author */}
                  <div className="admin-blogs-form-group">
                    <label>Author</label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Tags */}
                  <div className="admin-blogs-form-group">
                    <label>Tags</label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Category */}
                  <div className="admin-blogs-form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="admin-blogs-form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Featured Toggle */}
                  <div className="admin-blogs-form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleInputChange}
                      />
                      <span className="checkmark"></span>
                      Mark as Featured
                    </label>
                  </div>

                  {/* Ad Spaces */}
                  <div className="admin-blogs-form-group full-width">
                    <label>Ad Spaces</label>

                    <div className="adspace-actions">
                      <button
                        type="button"
                        className="ad-action-btn"
                        onClick={() => toggleAllAds(true)}
                      >
                        Enable All
                      </button>
                      <button
                        type="button"
                        className="ad-action-btn secondary"
                        onClick={() => toggleAllAds(false)}
                      >
                        Disable All
                      </button>
                    </div>

                    <div className="adspace-grid">
                      {["headerAd", "sidebarAd", "inContentAd", "footerAd"].map(
                        (ad) => (
                          <label key={ad} className="adspace-option">
                            <input
                              type="checkbox"
                              name={`adSpaces.${ad}`}
                              checked={formData.adSpaces[ad]}
                              onChange={handleInputChange}
                            />
                            <span className="adspace-checkmark"></span>
                            <span className="adspace-label">
                              {ad.replace(/([A-Z])/g, " $1")}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="admin-blogs-form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : editingId ? (
                      "Update Blog"
                    ) : (
                      "Create Blog"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Blog Table */}
        <div className="admin-blogs-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner large"></div>
              <p>Loading blog posts...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No blog posts found</h3>
              <p>Start by creating a new post</p>
              <button
                className="create-first-btn"
                onClick={() => setShowForm(true)}
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <>
              {/* TABLE (Desktop) */}
              <div className="table-responsive">
                <table className="admin-blogs-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th className="hide-mobile">Category</th>
                      <th>Status</th>
                      <th className="hide-tablet">Ads</th>
                      <th className="hide-mobile">Views</th>
                      <th className="hide-mobile">Likes</th>
                      <th className="hide-tablet">Published</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {blogs.map((blog) => {
                      const a = blog.adSpaces || {};
                      const hasAd =
                        a.headerAd || a.sidebarAd || a.inContentAd || a.footerAd;

                      return (
                        <tr key={blog._id} className="blog-row">
                          <td className="blog-title-cell">
                            <div className="blog-title-content">
                              <span className="blog-title">{blog.title}</span>
                              {blog.isFeatured && (
                                <span className="featured-badge">★</span>
                              )}
                            </div>
                          </td>

                          <td className="hide-mobile">
                            <span className="category-tag">{blog.category}</span>
                          </td>

                          <td>
                            <span
                              className={`status-badge ${blog.status}`}
                            >
                              {blog.status}
                            </span>
                          </td>

                          <td className="hide-tablet">
                            <span
                              className={`ad-indicator ${
                                hasAd ? "enabled" : "disabled"
                              }`}
                            >
                              {hasAd ? "✓" : "✗"}
                            </span>
                          </td>

                          <td className="hide-mobile">
                            <span className="count-number">
                              {blog.views || 0}
                            </span>
                          </td>

                          <td className="hide-mobile">
                            <span className="count-number">
                              {blog.likes || 0}
                            </span>
                          </td>

                          <td className="hide-tablet">
                            <span className="date-text">
                              {formatDate(blog.publishedAt)}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(blog)}
                              >
                                Edit
                              </button>

                              <div className="action-group">
                                {blog.status === "published" ? (
                                  <button
                                    className="action-btn warn-btn"
                                    onClick={() =>
                                      toggleStatus(blog, "draft")
                                    }
                                  >
                                    Unpublish
                                  </button>
                                ) : (
                                  <button
                                    className="action-btn success-btn"
                                    onClick={() =>
                                      toggleStatus(blog, "published")
                                    }
                                  >
                                    Publish
                                  </button>
                                )}

                                <button
                                  className="action-btn danger-btn"
                                  onClick={() =>
                                    handleDelete(blog._id, blog.title)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="mobile-cards-view">
                {blogs.map((blog) => {
                  const a = blog.adSpaces || {};
                  const hasAd =
                    a.headerAd || a.sidebarAd || a.inContentAd || a.footerAd;

                  return (
                    <div key={blog._id} className="blog-mobile-card">
                      <div className="card-header">
                        <h4 className="card-title">
                          {blog.title}
                          {blog.isFeatured && (
                            <span className="featured-badge">★</span>
                          )}
                        </h4>
                        <span className={`status-badge ${blog.status}`}>
                          {blog.status}
                        </span>
                      </div>

                      <div className="card-meta">
                        <span className="meta-item">
                          <strong>Category:</strong> {blog.category}
                        </span>

                        <span className="meta-item">
                          <strong>Ads:</strong>{" "}
                          <span
                            className={`ad-indicator ${
                              hasAd ? "enabled" : "disabled"
                            }`}
                          >
                            {hasAd ? "Enabled" : "Disabled"}
                          </span>
                        </span>

                        <span className="meta-item">
                          <strong>Views:</strong> {blog.views || 0}
                        </span>

                        <span className="meta-item">
                          <strong>Likes:</strong> {blog.likes || 0}
                        </span>

                        <span className="meta-item">
                          <strong>Published:</strong>{" "}
                          {formatDate(blog.publishedAt)}
                        </span>
                      </div>

                      <div className="card-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(blog)}
                        >
                          Edit
                        </button>

                        {blog.status === "published" ? (
                          <button
                            className="action-btn warn-btn"
                            onClick={() => toggleStatus(blog, "draft")}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            className="action-btn success-btn"
                            onClick={() =>
                              toggleStatus(blog, "published")
                            }
                          >
                            Publish
                          </button>
                        )}

                        <button
                          className="action-btn danger-btn"
                          onClick={() =>
                            handleDelete(blog._id, blog.title)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBlogs;
