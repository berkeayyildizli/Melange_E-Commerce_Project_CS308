import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RevenueCalculation = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleCalculateRevenue = async () => {
    if (!startDate || !endDate) {
      setError('Both start date and end date are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRevenueData([]);
      setFeedbackMessage('');
      const token = localStorage.getItem('adminToken');

      const url = `http://localhost:8000/salesManagerMethods/revenueAnalysis?start_date=${startDate}&end_date=${endDate}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const completeData = fillMissingDates(data.data || [], startDate, endDate);
        setRevenueData(completeData);
        setFeedbackMessage('Revenue data fetched successfully.');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch revenue data.');
      }
    } catch (err) {
      setError('An error occurred while fetching revenue data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fillMissingDates = (data, startDate, endDate) => {
    const dateMap = data.reduce((acc, curr) => {
      acc[curr.date] = curr;
      return acc;
    }, {});
    
    const allDates = generateDateRange(startDate, endDate);
    const cumulativeData = [];
    let cumulativeRevenue = 0;
    let cumulativeCount = 0;

    allDates.forEach((date) => {
      const dailyRevenue = dateMap[date]?.total_revenue || 0;
      const dailyCount = dateMap[date]?.purchase_count || 0;
      cumulativeRevenue += dailyRevenue;
      cumulativeCount += dailyCount;
      cumulativeData.push({
        date,
        daily_revenue: dailyRevenue,
        daily_loss: dailyRevenue * 0.15, // Calculate daily loss
        daily_count: dailyCount,
        cumulative_revenue: cumulativeRevenue,
        cumulative_loss: cumulativeRevenue * 0.15, // Calculate cumulative loss
        cumulative_count: cumulativeCount,
      });
    });

    return cumulativeData;
  };

  const generateDateRange = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const formatGraphData = () => {
    if (revenueData.length === 0) return null;

    const dates = revenueData.map((entry) => entry.date);
    const dailyRevenues = revenueData.map((entry) => entry.daily_revenue);
    const dailyLosses = revenueData.map((entry) => entry.daily_loss);
    const cumulativeRevenues = revenueData.map((entry) => entry.cumulative_revenue);
    const cumulativeLosses = revenueData.map((entry) => entry.cumulative_loss);

    return {
      labels: dates,
      datasets: [
        {
          label: 'Daily Revenue',
          data: dailyRevenues,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Cumulative Revenue',
          data: cumulativeRevenues,
          borderColor: '#6c757d',
          backgroundColor: 'rgba(108, 117, 125, 0.5)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Daily Loss (15%)',
          data: dailyLosses,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.5)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Cumulative Loss (15%)',
          data: cumulativeLosses,
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.5)',
          tension: 0.1,
          yAxisID: 'y',
        },
      ],
    };
  };

  const graphData = formatGraphData();

  return (
    <div>
      <h2>Revenue Calculation</h2>
      {feedbackMessage && <p style={{ color: 'green' }}>{feedbackMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label>
          Start Date (yyyy-mm-dd):
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date (yyyy-mm-dd):
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button style={styles.button} onClick={handleCalculateRevenue}>
          Calculate Revenue
        </button>
      </div>
      {loading && <p>Loading revenue data...</p>}
      {graphData && (
        <div style={styles.graphContainer}>
          <h3>Revenue, Loss, and Purchase Counts Over Time</h3>
          <Line data={graphData} options={styles.graphOptions} />
        </div>
      )}
    </div>
  );
};

const styles = {
  button: {
    padding: '10px 20px',
    marginTop: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  graphContainer: {
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
  },
  graphOptions: {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue and Loss Over Time (Cumulative and Daily)',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Amount',
        },
        beginAtZero: true,
      },
    },
  },
};

export default RevenueCalculation;