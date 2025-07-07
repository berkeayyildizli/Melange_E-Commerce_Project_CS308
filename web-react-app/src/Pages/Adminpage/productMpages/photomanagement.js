import React, { useEffect, useState } from 'react';

const PhotoManagement = () => {
  const [colorsWithoutPhoto, setColorsWithoutPhoto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState({}); // Track selected file per color row

  useEffect(() => {
    fetchColorsWithoutPhoto();
  }, []);

  const fetchColorsWithoutPhoto = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      setLoading(true);
      const response = await fetch('/adminMethods/listColorsWithoutPhoto', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to fetch colors without photo.');
      } else {
        const data = await response.json();
        if (data.colors_without_photo) {
          // Sort in descending order by base_product_id
          const sortedColors = data.colors_without_photo.sort(
            (a, b) => b.base_product_id - a.base_product_id
          );
          setColorsWithoutPhoto(sortedColors);
        }
      }
    } catch (err) {
      setError('An error occurred while fetching colors without photo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (base_product_id, color_name, file) => {
    // Store the file in state, keyed by base_product_id & color_name
    setSelectedFiles((prev) => ({
      ...prev,
      [`${base_product_id}_${color_name}`]: file
    }));
  };

  const handleUpload = async (base_product_id, color_name) => {
    setFeedbackMessage('');
    setError('');

    const file = selectedFiles[`${base_product_id}_${color_name}`];
    if (!file) {
      setError('Please choose a file first.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('base_product_id', base_product_id);
      formData.append('color_name', color_name);
      formData.append('image', file);

      const response = await fetch('/adminMethods/uploadProductColorImage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // No 'Content-Type'; fetch sets it automatically for FormData
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setFeedbackMessage(`Image uploaded successfully for color '${color_name}'.`);
        // Optionally remove it from the list
        setColorsWithoutPhoto((prev) =>
          prev.filter(
            (c) =>
              !(c.base_product_id === base_product_id && c.color_name === color_name)
          )
        );
      } else {
        setError(data.message || `Failed to upload image for color '${color_name}'.`);
      }
    } catch (err) {
      setError(`An error occurred while uploading image for color '${color_name}'.`);
      console.error(err);
    }
  };

  if (loading) return <p>Loading color list...</p>;
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h2>Photo Management</h2>
      {feedbackMessage && <p style={{ color: 'green' }}>{feedbackMessage}</p>}

      {colorsWithoutPhoto.length === 0 ? (
        <p>All product-colors have images!</p>
      ) : (
        <ul>
          {colorsWithoutPhoto.map((color) => (
            <li
              key={`${color.base_product_id}_${color.color_name}`}
              style={styles.listItem}
            >
              <div>
                <p>
                  <strong>Base Product ID:</strong> {color.base_product_id}
                </p>
                <p>
                  <strong>Color Name:</strong> {color.color_name}
                </p>
                <p>
                  <strong>Description:</strong> {color.color_description}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      color.base_product_id,
                      color.color_name,
                      e.target.files[0]
                    )
                  }
                />
                <button
                  style={styles.uploadButton}
                  onClick={() =>
                    handleUpload(color.base_product_id, color.color_name)
                  }
                >
                  Upload Photo
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const styles = {
  listItem: {
    border: '1px solid #ccc',
    margin: '10px',
    padding: '10px',
    borderRadius: '5px'
  },
  uploadButton: {
    marginTop: '10px'
  }
};

export default PhotoManagement;
