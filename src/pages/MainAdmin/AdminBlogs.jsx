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

// Lazy load Jodit editor to reduce initial bundle size
const LazyJoditEditor = React.lazy(() => import("jodit-react"));

// Icon Components
const BlogIcon = () => <span className="icon">📝</span>;
const StatsIcon = () => <span className="icon">📊</span>;
const PublishedIcon = () => <span className="icon">✅</span>;
const ViewsIcon = () => <span className="icon">👁️</span>;
const LikesIcon = () => <span className="icon">❤️</span>;
const AdsIcon = () => <span className="icon">💰</span>;
const PlusIcon = () => <span className="icon">➕</span>;
const SearchIcon = () => <span className="icon">🔍</span>;
const EditIcon = () => <span className="icon">✏️</span>;
const DeleteIcon = () => <span className="icon">🗑️</span>;
const CloseIcon = () => <span className="icon">×</span>;
const CheckIcon = () => <span className="icon">✓</span>;
const LoadingIcon = () => <span className="icon">⏳</span>;
const FeaturedIcon = () => <span className="icon">⭐</span>;
const DesignIcon = () => <span className="icon">🎨</span>;
const CodeIcon = () => <span className="icon">📄</span>;

const AdminBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editorMode, setEditorMode] = useState("design");
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [expandedBlog, setExpandedBlog] = useState(null);

  const editorRef = useRef(null);

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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const categories = useMemo(
    () => ["General", "Technology", "Business", "Lifestyle", "Health", "Education", "Finance", "Marketing"],
    []
  );

  const statusOptions = useMemo(() => ["draft", "published", "archived"], []);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Calculate ads enabled count
  const adsEnabledCount = useMemo(() => {
    return blogs.filter((blog) => {
      const a = blog.adSpaces || {};
      return a.headerAd || a.sidebarAd || a.inContentAd || a.footerAd;
    }).length;
  }, [blogs]);

  // Format date
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

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
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
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setErrorMessage(err?.response?.data?.message || "Failed to fetch blog data");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lazy-load editor CSS
  useEffect(() => {
    if (showForm && !editorLoaded) {
      import("jodit/es5/jodit.min.css")
        .then(() => {
          setEditorLoaded(true);
        })
        .catch((err) => {
          console.warn("Failed to load Jodit CSS:", err);
          setEditorLoaded(true);
        });
    }
  }, [showForm, editorLoaded]);

  // Form handlers
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
    setErrorMessage("");
    setSuccessMessage("");
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

    setEditingId(blog._id);
    setShowForm(true);
    setEditorMode("design");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

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
        setSuccessMessage("✅ Blog updated successfully!");
      } else {
        response = await api.post("/admin/blogs", submitData);
        setSuccessMessage("✅ Blog created successfully!");
      }

      if (response?.data?.success) {
        resetForm();
        fetchData();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMessage(err?.response?.data?.message || "Failed to save blog");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete blog
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      const res = await api.delete(`/admin/blogs/${id}`);
      if (res.data?.success) {
        setSuccessMessage("🗑️ Blog deleted successfully!");
        fetchData();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Delete error:", err);
      setErrorMessage("❌ Failed to delete blog");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Toggle blog status
  const toggleStatus = async (blog, newStatus) => {
    try {
      setLoading(true);
      const res = await api.put(`/admin/blogs/${blog._id}`, { status: newStatus });
      if (res.data?.success) {
        setSuccessMessage(`✅ Blog ${newStatus} successfully!`);
        fetchData();
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      setErrorMessage("❌ Failed to update status");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Toggle blog expansion on mobile
  const toggleBlogExpansion = (blogId) => {
    setExpandedBlog(expandedBlog === blogId ? null : blogId);
  };

  // Filter blogs based on search
  const filteredBlogs = blogs.filter(blog =>
    blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    blog.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-blogs-container">
      <AdminSidebar />
      
      <main className="admin-blogs-main">
        {/* Header Section */}
        <header className="admin-blogs-header">
          <div className="header-content">
            <div className="header-left">
              <div className="breadcrumb">
                <span onClick={() => navigate("/admin/dashboard")}>Dashboard</span>
                <span className="separator">/</span>
                <span className="current">Blog Management</span>
              </div>
              <div className="header-title">
                <h1><BlogIcon /> Blog Management</h1>
                <p className="subtitle">Create, edit, and manage your blog content</p>
              </div>
            </div>
            <div className="header-right">
              <button
                className="btn btn-primary new-post-btn"
                onClick={() => setShowForm(true)}
              >
                <PlusIcon /> {!isMobile && 'New Post'}
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon primary">
                <StatsIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.total}</h3>
                <p>Total Posts</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon success">
                <PublishedIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.published}</h3>
                <p>Published</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon info">
                <ViewsIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.totalViews}</h3>
                <p>Total Views</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon warning">
                <LikesIcon />
              </div>
              <div className="stat-content">
                <h3>{stats.totalLikes}</h3>
                <p>Total Likes</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon purple">
                <AdsIcon />
              </div>
              <div className="stat-content">
                <h3>{adsEnabledCount}</h3>
                <p>Ads Enabled</p>
              </div>
            </div>
          </div>
        </header>

        {/* Alerts */}
        <div className="alerts-container">
          {errorMessage && (
            <div className="alert alert-error slide-in">
              <div className="alert-content">
                <span className="icon">❌</span>
                <span>{errorMessage}</span>
              </div>
              <button className="alert-close" onClick={() => setErrorMessage("")}>
                <CloseIcon />
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success slide-in">
              <div className="alert-content">
                <span className="icon">✅</span>
                <span>{successMessage}</span>
              </div>
              <button className="alert-close" onClick={() => setSuccessMessage("")}>
                <CloseIcon />
              </button>
            </div>
          )}
        </div>

        <div className="admin-blogs-content">
          {/* Filters and Search */}
          <div className="content-header">
            <div className="filters-container">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search posts by title, tags, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
              
              <div className="filter-buttons">
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
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading blog posts...</p>
            </div>
          )}

          {/* Blog Form Modal */}
          {showForm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">
                    {editingId ? '✏️ Edit Blog Post' : '➕ Create New Post'}
                  </h3>
                  <button className="modal-close" onClick={resetForm}>
                    <CloseIcon />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="blog-form">
                  {/* Form Sections */}
                  <div className="form-section">
                    <h4 className="section-title">Basic Information</h4>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label required">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Enter blog post title"
                          required
                        />
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label required">Excerpt</label>
                        <textarea
                          name="excerpt"
                          value={formData.excerpt}
                          onChange={handleInputChange}
                          className="form-textarea"
                          placeholder="Brief description of the post"
                          rows="3"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Editor */}
                  <div className="form-section">
                    <h4 className="section-title">Content</h4>
                    <div className="editor-switcher">
                      <button
                        type="button"
                        className={`editor-tab ${editorMode === 'design' ? 'active' : ''}`}
                        onClick={() => setEditorMode('design')}
                      >
                        <DesignIcon /> Visual Editor
                      </button>
                      <button
                        type="button"
                        className={`editor-tab ${editorMode === 'html' ? 'active' : ''}`}
                        onClick={() => setEditorMode('html')}
                      >
                        <CodeIcon /> HTML Editor
                      </button>
                    </div>

                    <div className="editor-container">
                      {editorMode === 'design' ? (
                        editorLoaded ? (
                          <Suspense fallback={
                            <div className="editor-loading">
                              <div className="loading-spinner"></div>
                              <p>Loading editor...</p>
                            </div>
                          }>
                            <LazyJoditEditor
                              ref={editorRef}
                              value={formData.content}
                              onChange={(newContent) =>
                                setFormData(prev => ({ ...prev, content: newContent }))
                              }
                              config={{
                                height: 400,
                                toolbarAdaptive: false,
                                buttons: 'bold,italic,underline,strikethrough,|,ul,ol,|,font,fontsize,|,image,video,link,|,align,undo,redo'
                              }}
                            />
                          </Suspense>
                        ) : (
                          <div className="editor-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading editor...</p>
                          </div>
                        )
                      ) : (
                        <textarea
                          className="html-editor"
                          value={formData.content}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, content: e.target.value }))
                          }
                          rows="15"
                          placeholder="Enter HTML content here..."
                        />
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="form-section">
                    <h4 className="section-title">Additional Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Featured Image URL</label>
                        <input
                          type="text"
                          name="featuredImage"
                          value={formData.featuredImage}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Author</label>
                        <input
                          type="text"
                          name="author"
                          value={formData.author}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Author name"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tags</label>
                        <input
                          type="text"
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="tech, business, marketing (comma separated)"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Featured</label>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            name="isFeatured"
                            checked={formData.isFeatured}
                            onChange={handleInputChange}
                            className="toggle-input"
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-label">
                            {formData.isFeatured ? 'Featured' : 'Not Featured'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Ad Spaces */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4 className="section-title">Ad Spaces</h4>
                      <div className="ad-controls">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleAllAds(true)}
                        >
                          Enable All
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleAllAds(false)}
                        >
                          Disable All
                        </button>
                      </div>
                    </div>
                    
                    <div className="ad-grid">
                      {['headerAd', 'sidebarAd', 'inContentAd', 'footerAd'].map((ad) => (
                        <label key={ad} className="ad-option">
                          <input
                            type="checkbox"
                            name={`adSpaces.${ad}`}
                            checked={formData.adSpaces[ad]}
                            onChange={handleInputChange}
                            className="ad-checkbox"
                          />
                          <span className="ad-checkmark"></span>
                          <span className="ad-label">
                            {ad.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SEO Information */}
                  <div className="form-section">
                    <h4 className="section-title">SEO Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Meta Title</label>
                        <input
                          type="text"
                          name="metaTitle"
                          value={formData.metaTitle}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="SEO title"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Meta Description</label>
                        <textarea
                          name="metaDescription"
                          value={formData.metaDescription}
                          onChange={handleInputChange}
                          className="form-textarea"
                          placeholder="SEO description"
                          rows="2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary cancel-btn"
                      onClick={resetForm}
                      disabled={formLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary submit-btn"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <LoadingIcon /> Saving...
                        </>
                      ) : editingId ? (
                        'Update Post'
                      ) : (
                        'Create Post'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Blog Posts List */}
          <div className="blogs-section">
            {filteredBlogs.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <BlogIcon />
                </div>
                <h3>{searchTerm ? 'No Matching Posts' : 'No Blog Posts Yet'}</h3>
                <p>
                  {searchTerm 
                    ? 'Try a different search term'
                    : 'Start writing your first blog post'
                  }
                </p>
                {!searchTerm && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    <PlusIcon /> Create First Post
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile/Tablet Cards View */}
                {(isMobile || isTablet) && (
                  <div className="blog-cards">
                    {filteredBlogs.map((blog) => {
                      const a = blog.adSpaces || {};
                      const hasAd = a.headerAd || a.sidebarAd || a.inContentAd || a.footerAd;
                      
                      return (
                        <div 
                          key={blog._id} 
                          className={`blog-card ${!blog.isActive ? 'inactive' : ''} ${expandedBlog === blog._id ? 'expanded' : ''}`}
                          onClick={() => isMobile && toggleBlogExpansion(blog._id)}
                        >
                          <div className="card-header">
                            <div className="blog-info">
                              <h4 className="blog-title">
                                {blog.title}
                                {blog.isFeatured && (
                                  <span className="featured-badge">
                                    <FeaturedIcon /> Featured
                                  </span>
                                )}
                              </h4>
                              <div className="blog-meta">
                                <span className="blog-category">{blog.category}</span>
                                <span className="blog-date">{formatDate(blog.createdAt)}</span>
                              </div>
                            </div>
                            <span className={`status-badge ${blog.status}`}>
                              {blog.status}
                            </span>
                          </div>

                          <div className="card-body">
                            <p className="blog-excerpt">{blog.excerpt}</p>
                            
                            {(expandedBlog === blog._id || !isMobile) && (
                              <>
                                <div className="blog-stats">
                                  <div className="stat-item">
                                    <span className="stat-label">Views:</span>
                                    <span className="stat-value">{blog.views || 0}</span>
                                  </div>
                                  <div className="stat-item">
                                    <span className="stat-label">Likes:</span>
                                    <span className="stat-value">{blog.likes || 0}</span>
                                  </div>
                                  <div className="stat-item">
                                    <span className="stat-label">Ads:</span>
                                    <span className={`stat-value ${hasAd ? 'enabled' : 'disabled'}`}>
                                      {hasAd ? 'Enabled' : 'Disabled'}
                                    </span>
                                  </div>
                                </div>

                                {blog.tags?.length > 0 && (
                                  <div className="blog-tags">
                                    {blog.tags.slice(0, 3).map((tag, idx) => (
                                      <span key={idx} className="tag">{tag}</span>
                                    ))}
                                    {blog.tags.length > 3 && (
                                      <span className="tag-more">+{blog.tags.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div className="card-actions">
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(blog);
                                }}
                                title="Edit Post"
                                disabled={loading}
                              >
                                <EditIcon />
                              </button>
                              {blog.status === 'published' ? (
                                <button
                                  className="btn-icon btn-warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatus(blog, 'draft');
                                  }}
                                  title="Unpublish"
                                  disabled={loading}
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  className="btn-icon btn-success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleStatus(blog, 'published');
                                  }}
                                  title="Publish"
                                  disabled={loading}
                                >
                                  Publish
                                </button>
                              )}
                              <button
                                className="btn-icon btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(blog._id, blog.title);
                                }}
                                title="Delete Post"
                                disabled={loading}
                              >
                                <DeleteIcon />
                              </button>
                              {isMobile && (
                                <button
                                  className="btn-icon btn-expand"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBlogExpansion(blog._id);
                                  }}
                                  title={expandedBlog === blog._id ? 'Collapse' : 'Expand'}
                                >
                                  {expandedBlog === blog._id ? '▲' : '▼'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Desktop Table View */}
                {!isMobile && !isTablet && (
                  <div className="blogs-table-container">
                    <div className="table-responsive">
                      <table className="blogs-table">
                        <thead>
                          <tr>
                            <th>Post</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Ads</th>
                            <th>Views</th>
                            <th>Likes</th>
                            <th>Created</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBlogs.map((blog) => {
                            const a = blog.adSpaces || {};
                            const hasAd = a.headerAd || a.sidebarAd || a.inContentAd || a.footerAd;
                            
                            return (
                              <tr key={blog._id} className={!blog.isActive ? 'inactive' : ''}>
                                <td className="post-cell">
                                  <div className="post-info">
                                    <div className="post-title">
                                      {blog.title}
                                      {blog.isFeatured && (
                                        <span className="featured-indicator">
                                          <FeaturedIcon />
                                        </span>
                                      )}
                                    </div>
                                    <div className="post-excerpt">{blog.excerpt}</div>
                                    <div className="post-meta">
                                      <span className="author">{blog.author}</span>
                                      {blog.tags?.slice(0, 2).map((tag, idx) => (
                                        <span key={idx} className="tag">{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                                <td className="category-cell">
                                  <span className="category-badge">{blog.category}</span>
                                </td>
                                <td className="status-cell">
                                  <span className={`status-badge ${blog.status}`}>
                                    {blog.status}
                                  </span>
                                </td>
                                <td className="ads-cell">
                                  <span className={`ad-indicator ${hasAd ? 'enabled' : 'disabled'}`}>
                                    {hasAd ? <CheckIcon /> : <CloseIcon />}
                                  </span>
                                </td>
                                <td className="views-cell">
                                  <span className="count">{blog.views || 0}</span>
                                </td>
                                <td className="likes-cell">
                                  <span className="count">{blog.likes || 0}</span>
                                </td>
                                <td className="date-cell">
                                  <div className="date-info">
                                    <div>{formatDate(blog.createdAt)}</div>
                                    <div className="time">{formatTime(blog.createdAt)}</div>
                                  </div>
                                </td>
                                <td className="actions-cell">
                                  <div className="action-buttons">
                                    <button
                                      className="btn-icon btn-edit"
                                      onClick={() => handleEdit(blog)}
                                      title="Edit Post"
                                      disabled={loading}
                                    >
                                      <EditIcon />
                                    </button>
                                    {blog.status === 'published' ? (
                                      <button
                                        className="btn-icon btn-warning"
                                        onClick={() => toggleStatus(blog, 'draft')}
                                        title="Unpublish"
                                        disabled={loading}
                                      >
                                        Unpublish
                                      </button>
                                    ) : (
                                      <button
                                        className="btn-icon btn-success"
                                        onClick={() => toggleStatus(blog, 'published')}
                                        title="Publish"
                                        disabled={loading}
                                      >
                                        Publish
                                      </button>
                                    )}
                                    <button
                                      className="btn-icon btn-delete"
                                      onClick={() => handleDelete(blog._id, blog.title)}
                                      title="Delete Post"
                                      disabled={loading}
                                    >
                                      <DeleteIcon />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Table Summary */}
                {filteredBlogs.length > 0 && (
                  <div className="table-summary">
                    <div className="summary-info">
                      Showing {filteredBlogs.length} of {blogs.length} posts
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowForm(true)}
                    >
                      <PlusIcon /> Create New Post
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminBlogs;