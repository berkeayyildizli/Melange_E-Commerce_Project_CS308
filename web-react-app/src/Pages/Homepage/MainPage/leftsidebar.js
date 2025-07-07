import React, { useState } from "react";
import "./leftsidebar.css";
import { GrAdd, GrSubtract } from "react-icons/gr";

const LeftSidebar = ({ filterOptions, onSortSelection, onFilter, onResetFilters, onSearch }) => {
  const [expanded, setExpanded] = useState({});
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCategory = (category) => {
    setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleFilterChange = (type, value, isChecked) => {
    const newFilters = { ...filters };
    if (isChecked) {
      if (!newFilters[type]) {
        newFilters[type] = [];
      }
      newFilters[type].push(value);
    } else {
      newFilters[type] = newFilters[type]?.filter((item) => item !== value);
    }

    setFilters(newFilters);
    if (typeof onFilter === "function") {
      onFilter(newFilters);
    }
  };

  const resetFilters = () => {
    setFilters({});
    if (typeof onResetFilters === "function") {
      onResetFilters();
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    if (typeof onSearch === "function") {
      onSearch(query);
    }
  };

  return (
    <div className="left-sidebar">
      <h3>SEARCH</h3>
      <input
        type="text"
        placeholder="Search on Mélange"
        value={searchTerm}
        onChange={handleSearch}
        className="navbarcomp_search-bar"
      />

      <h3>SORT</h3>
      <ul>
        <li onClick={() => onSortSelection({ sort_by: "popularity", order: "desc" })}>Best Sellers</li>
        <li onClick={() => onSortSelection({ sort_by: "price", order: "asc" })}>Lowest to Highest</li>
        <li onClick={() => onSortSelection({ sort_by: "price", order: "desc" })}>Highest to Lowest</li>
      </ul>

      <h3>FILTERS</h3>
      <ul>
        {filterOptions.category_name && (
          <li onClick={() => toggleCategory("category")}>
            CATEGORIES {expanded.category ? <GrSubtract /> : <GrAdd />}
          </li>
        )}
        {expanded.category && (
          <ul>
            {filterOptions.category_name.map((category, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      handleFilterChange("category_name", category, e.target.checked)
                    }
                  />
                  {category}
                </label>
              </li>
            ))}
          </ul>
        )}

        {filterOptions.distributor && (
          <li onClick={() => toggleCategory("distributor")}>
            DISTRIBUTOR {expanded.distributor ? <GrSubtract /> : <GrAdd />}
          </li>
        )}
        {expanded.distributor && (
          <ul>
            {filterOptions.distributor.map((distributor, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      handleFilterChange("distributor", distributor, e.target.checked)
                    }
                  />
                  {distributor}
                </label>
              </li>
            ))}
          </ul>
        )}

        {filterOptions.colors && (
          <li onClick={() => toggleCategory("color")}>
            COLOR {expanded.color ? <GrSubtract /> : <GrAdd />}
          </li>
        )}
        {expanded.color && (
          <ul>
            {filterOptions.colors.map((color, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    onChange={(e) => handleFilterChange("color", color, e.target.checked)}
                  />
                  {color}
                </label>
              </li>
            ))}
          </ul>
        )}

        {filterOptions.sizes && (
          <li onClick={() => toggleCategory("size")}>
            SIZE {expanded.size ? <GrSubtract /> : <GrAdd />}
          </li>
        )}
        {expanded.size && (
          <ul>
            {filterOptions.sizes.map((size, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    onChange={(e) => handleFilterChange("size", size, e.target.checked)}
                  />
                  {size}
                </label>
              </li>
            ))}
          </ul>
        )}
      </ul>

      <button onClick={resetFilters} className="reset-filters-button">
        Reset Filters
      </button>
    </div>
  );
};

export default LeftSidebar;