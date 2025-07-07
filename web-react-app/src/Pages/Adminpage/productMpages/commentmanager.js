import React, { useEffect, useState } from 'react';

const CommentApproval = () => {
  const [pendingComments, setPendingComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    const fetchPendingComments = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/adminMethods/pending-comments', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPendingComments(data.pending_comments || []);
        } else {
          const data = await response.json();
          setError(data.message || 'Failed to fetch pending comments.');
        }
      } catch (err) {
        setError('An error occurred while fetching pending comments.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingComments();
  }, []);

  const handleApproveComment = async (commentId) => {
    try {
      setFeedbackMessage('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/approveComment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackMessage(data.message || `Comment ${commentId} approved successfully.`);
        setPendingComments((prevComments) =>
          prevComments.filter((comment) => comment.comment_id !== commentId)
        );
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to approve comment.');
      }
    } catch (err) {
      setError('An error occurred while approving the comment.');
      console.error(err);
    }
  };


  const handleDeclineComment = async (commentId) => {
    try {
      setFeedbackMessage('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/adminMethods/declineComment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackMessage(data.message || `Comment ${commentId} declined successfully.`);
        setPendingComments((prevComments) =>
          prevComments.filter((comment) => comment.comment_id !== commentId)
        );
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to approve comment.');
      }
    } catch (err) {
      setError('An error occurred while approving the comment.');
      console.error(err);
    }
  };

  if (loading) return <p>Loading pending comments...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Comment Approval</h2>
      {feedbackMessage && <p style={{ color: 'green' }}>{feedbackMessage}</p>}
      {pendingComments.length > 0 ? (
        <ul>
          {pendingComments.map((comment) => (
            <li key={comment.comment_id} style={styles.commentItem}>
              <div>
                <p>
                  <strong>Comment ID:</strong> {comment.comment_id}
                </p>
                <p>
                  <strong>Customer ID:</strong> {comment.customer_id}
                </p>
                <p>
                  <strong>Product ID:</strong> {comment.product_id}
                </p>
                <p>
                  <strong>Comment:</strong> {comment.comment_content}
                </p>
                <p>
                  <strong>Submitted On:</strong> {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
              <div style={styles.buttonGroup}>
                <button
                  style={{ ...styles.button, backgroundColor: 'green' }}
                  onClick={() => handleApproveComment(comment.comment_id)}
                >
                  Approve
                </button>
                <button
                  style={{ ...styles.button, backgroundColor: 'red' }}
                  onClick={() => handleDeclineComment(comment.comment_id)}
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending comments to display.</p>
      )}
    </div>
  );
};

const styles = {
  commentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  button: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
  },
};

export default CommentApproval;