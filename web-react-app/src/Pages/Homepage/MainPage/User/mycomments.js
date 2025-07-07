import React, { useEffect, useState } from 'react';
import './userpage.css'; // Import the updated CSS file

const STATUS_MAP = {
  0: 'Pending Approval',
  1: 'Approved',
  2: 'Declined'
};

const MyComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // Default filter is 'all'

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('User is not authenticated');

      const response = await fetch('/commentRating/mycomments', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch comments');

      setComments(data.comments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter comments based on the selected filter
  const filteredComments = comments.filter((comment) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return comment.comment_status === 0;
    if (filter === 'approved') return comment.comment_status === 1;
    if (filter === 'declined') return comment.comment_status === 2;
    return true;
  });

  return (
    <div className="account-comments">
      <h2>My Comments</h2>

      {error && <p className="account-error-message">{error}</p>}

      <div className="comment-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending Approval
        </button>
        <button
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button
          className={filter === 'declined' ? 'active' : ''}
          onClick={() => setFilter('declined')}
        >
          Declined
        </button>
      </div>

      {loading ? (
        <p>Loading comments...</p>
      ) : filteredComments.length > 0 ? (
        <ul className="account-comment-list">
          {filteredComments.map((comment) => (
            <li key={comment.comment_id} className="account-comment-item">
              <p>
                <strong>Product ID:</strong> {comment.product_id}
              </p>
              <p>
                <strong>Comment:</strong> {comment.comment_content}
              </p>
              <p>
                <strong>Status:</strong> {STATUS_MAP[comment.comment_status]}
              </p>
              <p>
                <strong>Submitted On:</strong>{' '}
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No comments found.</p>
      )}
    </div>
  );
};

export default MyComments;