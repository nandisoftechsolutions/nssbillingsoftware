// src/pages/MainAdmin/AdminRatingManage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Box,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Rating,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import AdminSidebar from '../../components/AdminSidebar';
import './AdminRatingManage.css';

// Mock API service - Replace with real API calls
const apiService = {
  // Fetch all ratings (for admin)
  async getRatings() {
    try {
      // For now, return mock data until backend is ready
      // Replace this with actual API call:
      // const response = await fetch('/api/admin/ratings', {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //   },
      // });
      // const data = await response.json();
      // return data;
      
      // Mock data - remove this when connecting to real API
      return {
        success: true,
        ratings: [
          {
            _id: '1',
            rating: 5,
            comment: 'Excellent billing software! Has simplified our GST filing process significantly.',
            status: 'approved',
            createdAt: '2024-03-15T10:30:00Z',
            user: {
              name: 'Rahul Sharma',
              businessName: 'Sharma Traders',
              email: 'rahul@sharma.com',
              phone: '+91 9876543210'
            }
          },
          {
            _id: '2',
            rating: 4,
            comment: 'Good software but needs more reporting features. Support team is responsive.',
            status: 'pending',
            createdAt: '2024-03-14T14:20:00Z',
            user: {
              name: 'Priya Patel',
              businessName: 'Patel Textiles',
              email: 'priya@patel.com',
              phone: '+91 9876543211'
            }
          },
          {
            _id: '3',
            rating: 5,
            comment: 'Best billing software in the market. Automated our entire inventory management.',
            status: 'approved',
            createdAt: '2024-03-13T09:15:00Z',
            user: {
              name: 'Amit Kumar',
              businessName: 'Kumar Electronics',
              email: 'amit@kumar.com',
              phone: '+91 9876543212'
            }
          },
          {
            _id: '4',
            rating: 3,
            comment: 'User interface could be better. Sometimes slow during peak hours.',
            status: 'rejected',
            createdAt: '2024-03-12T16:45:00Z',
            user: {
              name: 'Sneha Singh',
              businessName: 'Singh Fashions',
              email: 'sneha@singh.com',
              phone: '+91 9876543213'
            }
          },
          {
            _id: '5',
            rating: 5,
            comment: 'Saved us 10+ hours per week on billing. Highly recommended for SMEs.',
            status: 'approved',
            createdAt: '2024-03-11T11:00:00Z',
            user: {
              name: 'Vikram Mehta',
              businessName: 'Mehta Hardware',
              email: 'vikram@mehta.com',
              phone: '+91 9876543214'
            }
          },
        ],
        total: 5,
        stats: {
          total: 5,
          approved: 3,
          pending: 1,
          rejected: 1,
          averageRating: 4.4
        }
      };
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  },

  // Approve a rating
  async approveRating(ratingId) {
    try {
      // Replace with actual API call:
      // const response = await fetch(`/api/admin/ratings/${ratingId}/approve`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // return await response.json();
      
      // Mock response
      return { success: true, message: 'Rating approved successfully' };
    } catch (error) {
      console.error('Error approving rating:', error);
      throw error;
    }
  },

  // Reject a rating
  async rejectRating(ratingId) {
    try {
      // Replace with actual API call:
      // const response = await fetch(`/api/admin/ratings/${ratingId}/reject`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // return await response.json();
      
      // Mock response
      return { success: true, message: 'Rating rejected successfully' };
    } catch (error) {
      console.error('Error rejecting rating:', error);
      throw error;
    }
  },

  // Delete a rating
  async deleteRating(ratingId) {
    try {
      // Replace with actual API call:
      // const response = await fetch(`/api/admin/ratings/${ratingId}`, {
      //   method: 'DELETE',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //   },
      // });
      // return await response.json();
      
      // Mock response
      return { success: true, message: 'Rating deleted successfully' };
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  }
};

const AdminRatingManage = () => {
  // State management
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReviews, setTotalReviews] = useState(0);
  
  // Filter states
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 0,
  });

  // Fetch all reviews from API
  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the apiService
      const result = await apiService.getRatings();
      
      if (result.success) {
        setReviews(result.ratings || []);
        setTotalReviews(result.total || result.ratings?.length || 0);
        
        // If stats are provided in API response, use them
        if (result.stats) {
          setStats(result.stats);
        } else {
          // Otherwise calculate from reviews
          calculateStats(result.ratings || []);
        }
      } else {
        throw new Error(result.message || 'Failed to fetch reviews');
      }
      
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err.message || 'Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (reviewsList) => {
    const total = reviewsList.length;
    const approved = reviewsList.filter(r => r.status === 'approved').length;
    const pending = reviewsList.filter(r => r.status === 'pending').length;
    const rejected = reviewsList.filter(r => r.status === 'rejected').length;
    const averageRating = reviewsList.length > 0 
      ? reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length 
      : 0;
    
    setStats({
      total,
      approved,
      pending,
      rejected,
      averageRating: parseFloat(averageRating.toFixed(1)),
    });
  };

  // Handle approve review
  const handleApproveReview = async (reviewId) => {
    try {
      setLoading(true);
      
      const result = await apiService.approveRating(reviewId);
      
      if (result.success) {
        setSuccess(result.message || 'Review approved successfully!');
        
        // Update local state
        setReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { ...review, status: 'approved' } 
            : review
        ));
        
        // Update stats
        calculateStats(reviews.map(r => 
          r._id === reviewId ? { ...r, status: 'approved' } : r
        ));
      } else {
        throw new Error(result.message || 'Failed to approve review');
      }
      
    } catch (err) {
      console.error('Failed to approve review:', err);
      setError(err.message || 'Failed to approve review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject review
  const handleRejectReview = async (reviewId) => {
    try {
      setLoading(true);
      
      const result = await apiService.rejectRating(reviewId);
      
      if (result.success) {
        setSuccess(result.message || 'Review rejected successfully!');
        
        // Update local state
        setReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { ...review, status: 'rejected' } 
            : review
        ));
        
        // Update stats
        calculateStats(reviews.map(r => 
          r._id === reviewId ? { ...r, status: 'rejected' } : r
        ));
      } else {
        throw new Error(result.message || 'Failed to reject review');
      }
      
    } catch (err) {
      console.error('Failed to reject review:', err);
      setError(err.message || 'Failed to reject review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      setLoading(true);
      
      const result = await apiService.deleteRating(reviewId);
      
      if (result.success) {
        setSuccess(result.message || 'Review deleted successfully!');
        
        // Remove from local state
        setReviews(prev => prev.filter(review => review._id !== reviewId));
        setTotalReviews(prev => prev - 1);
        
        // Update stats
        calculateStats(reviews.filter(r => r._id !== reviewId));
        setDeleteDialogOpen(false);
      } else {
        throw new Error(result.message || 'Failed to delete review');
      }
      
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError(err.message || 'Failed to delete review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open view dialog
  const handleViewReview = (review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter reviews based on status, search, and rating
  const filteredReviews = reviews.filter(review => {
    // Filter by status
    if (filter === 'approved' && review.status !== 'approved') return false;
    if (filter === 'pending' && review.status !== 'pending') return false;
    if (filter === 'rejected' && review.status !== 'rejected') return false;
    
    // Filter by rating
    if (ratingFilter !== 'all' && review.rating !== parseInt(ratingFilter)) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = review.user?.name || '';
      const businessName = review.user?.businessName || '';
      const email = review.user?.email || '';
      const comment = review.comment || '';
      
      return (
        userName.toLowerCase().includes(query) ||
        businessName.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        comment.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Approved"
            color="success"
            size="small"
            variant="outlined"
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Pending"
            color="warning"
            size="small"
            variant="outlined"
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Rejected"
            color="error"
            size="small"
            variant="outlined"
          />
        );
      default:
        return (
          <Chip
            label={status || 'Unknown'}
            size="small"
            variant="outlined"
          />
        );
    }
  };

  // Get rating stars
  const renderRating = (rating) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Rating
          value={rating}
          readOnly
          precision={0.5}
          icon={<StarIcon fontSize="small" />}
          emptyIcon={<StarBorderIcon fontSize="small" />}
        />
        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
          {rating?.toFixed(1) || '0.0'}
        </Typography>
      </Box>
    );
  };

  // Get user display name
  const getUserDisplayName = (user) => {
    if (!user) return 'Anonymous';
    return user.name || user.email?.split('@')[0] || 'User';
  };

  // Get business name
  const getBusinessName = (user) => {
    if (!user) return 'N/A';
    return user.businessName || user.companyName || 'Individual';
  };

  // Initialize on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  // Close snackbar
  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, ml: { xs: 0, md: '240px' } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Customer Reviews Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and moderate customer testimonials and ratings
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Currently using demo data. Connect to backend API when available.
          </Alert>
        </Box>

        {/* Statistics Cards - Updated MUI Grid v2 syntax */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">
                    Total Reviews
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All customer reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="success.main">
                    Approved
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Published testimonials
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbDownIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="warning.main">
                    Pending
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="secondary.main">
                    Avg. Rating
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="secondary.main">
                  {stats.averageRating}
                  <Typography component="span" variant="h6" color="text.secondary">
                    /5
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average customer rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search by name, business, or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filter}
                  label="Status"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status ({stats.total})</MenuItem>
                  <MenuItem value="approved">Approved ({stats.approved})</MenuItem>
                  <MenuItem value="pending">Pending ({stats.pending})</MenuItem>
                  <MenuItem value="rejected">Rejected ({stats.rejected})</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rating</InputLabel>
                <Select
                  value={ratingFilter}
                  label="Rating"
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <MenuItem value="all">All Ratings</MenuItem>
                  <MenuItem value="5">5 Stars</MenuItem>
                  <MenuItem value="4">4 Stars</MenuItem>
                  <MenuItem value="3">3 Stars</MenuItem>
                  <MenuItem value="2">2 Stars</MenuItem>
                  <MenuItem value="1">1 Star</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 1 }} sx={{ textAlign: 'right' }}>
              <Tooltip title="Refresh reviews">
                <IconButton
                  onClick={fetchReviews}
                  disabled={loading}
                  color="primary"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredReviews.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No reviews found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || filter !== 'all' || ratingFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No reviews available'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Business</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredReviews
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((review) => (
                        <TableRow key={review._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {getUserDisplayName(review.user)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {review.user?.email || 'No email'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                              <Typography variant="body2">
                                {getBusinessName(review.user)}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            {renderRating(review.rating)}
                          </TableCell>
                          
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {review.comment || 'No comment provided'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            {getStatusChip(review.status)}
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarIcon sx={{ mr: 1, fontSize: 'small', color: 'action.active' }} />
                              <Typography variant="body2">
                                {formatDate(review.createdAt)}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <Tooltip title="View details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewReview(review)}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              {review.status === 'pending' && (
                                <>
                                  <Tooltip title="Approve review">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleApproveReview(review._id)}
                                      disabled={loading}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Reject review">
                                    <IconButton
                                      size="small"
                                      color="warning"
                                      onClick={() => handleRejectReview(review._id)}
                                      disabled={loading}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              
                              <Tooltip title="Delete review">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(review)}
                                  disabled={loading}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredReviews.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>

        {/* View Review Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedReview && (
            <>
              <DialogTitle>
                <Typography variant="h6" fontWeight="bold">
                  Review Details
                </Typography>
              </DialogTitle>
              
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Customer Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6">{getUserDisplayName(selectedReview.user)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedReview.user?.email || 'No email'}
                        </Typography>
                        {selectedReview.user?.phone && (
                          <Typography variant="body2" color="text.secondary">
                            {selectedReview.user.phone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6">{getBusinessName(selectedReview.user)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Business
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Review Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {renderRating(selectedReview.rating)}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <CalendarIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6">{formatDate(selectedReview.createdAt)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Submitted Date
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Status:</strong>
                      </Typography>
                      {getStatusChip(selectedReview.status)}
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Review Content
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'grey.50', minHeight: 100 }}>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        "{selectedReview.comment || 'No comment provided'}"
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
              
              <DialogActions>
                {selectedReview.status === 'pending' && (
                  <>
                    <Button
                      startIcon={<CheckCircleIcon />}
                      variant="contained"
                      color="success"
                      onClick={() => {
                        handleApproveReview(selectedReview._id);
                        setViewDialogOpen(false);
                      }}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      variant="outlined"
                      color="warning"
                      onClick={() => {
                        handleRejectReview(selectedReview._id);
                        setViewDialogOpen(false);
                      }}
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  variant="outlined"
                >
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={() => setDeleteDialogOpen(false)}
        >
          {selectedReview && (
            <>
              <DialogTitle>
                <Typography variant="h6" fontWeight="bold" color="error">
                  Delete Review
                </Typography>
              </DialogTitle>
              
              <DialogContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This action cannot be undone. Are you sure you want to delete this review?
                </Alert>
                
                <Typography variant="body1" paragraph>
                  <strong>Customer:</strong> {getUserDisplayName(selectedReview.user)}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Business:</strong> {getBusinessName(selectedReview.user)}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Rating:</strong> {selectedReview.rating}/5
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Status:</strong> {selectedReview.status}
                </Typography>
                <Typography variant="body1">
                  <strong>Comment:</strong> "{selectedReview.comment ? 
                    (selectedReview.comment.length > 100 
                      ? selectedReview.comment.substring(0, 100) + "..." 
                      : selectedReview.comment)
                    : 'No comment'}"
                </Typography>
              </DialogContent>
              
              <DialogActions>
                <Button
                  onClick={() => setDeleteDialogOpen(false)}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  variant="contained"
                  color="error"
                  onClick={() => handleDeleteReview(selectedReview._id)}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Review'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Snackbars for notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default AdminRatingManage;