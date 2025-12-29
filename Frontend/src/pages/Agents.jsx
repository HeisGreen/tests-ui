import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { travelAgentAPI, messagingAPI } from "../utils/api";
import { countries } from "../data/countries";
import { FiSearch, FiMessageCircle, FiMapPin, FiStar, FiGlobe, FiClock } from "react-icons/fi";
import "./Agents.css";

function Agents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    country: "",
    destination_expertise: "",
    availability: "",
    experience_level: "",
    specialization: "",
  });

  useEffect(() => {
    loadAgents();
  }, [filters]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await travelAgentAPI.listAgents(filters);
      setAgents(data);
      setError(null);
    } catch (err) {
      console.error("Error loading agents:", err);
      setError(err.message || "Failed to load travel agents");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAgent = async (agentId) => {
    try {
      // Create or get conversation
      const conversation = await messagingAPI.createConversation(agentId, "");
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const sortedCountries = [...countries].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const specializationLabels = {
    visas: "Visas",
    relocation: "Relocation",
    student_migration: "Student Migration",
    work_permits: "Work Permits",
    family_reunification: "Family Reunification",
    business_immigration: "Business Immigration",
    investment_immigration: "Investment Immigration",
    tourism_visas: "Tourism Visas",
    permanent_residency: "Permanent Residency",
    citizenship: "Citizenship",
  };

  const getCountryName = (code) => {
    const country = sortedCountries.find((c) => c.code === code);
    return country?.name || code;
  };

  return (
    <div className="agents-page">
      <div className="agents-header">
        <h1>Connect with a Travel Agent</h1>
        <p>Get personalized help from experienced migration experts</p>
      </div>

      <div className="agents-filters">
        <div className="filter-group">
          <label>Country</label>
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters({ ...filters, country: e.target.value })
            }
          >
            <option value="">All Countries</option>
            {sortedCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Destination Expertise</label>
          <select
            value={filters.destination_expertise}
            onChange={(e) =>
              setFilters({ ...filters, destination_expertise: e.target.value })
            }
          >
            <option value="">All Destinations</option>
            {sortedCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Availability</label>
          <select
            value={filters.availability}
            onChange={(e) =>
              setFilters({ ...filters, availability: e.target.value })
            }
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Experience Level</label>
          <select
            value={filters.experience_level}
            onChange={(e) =>
              setFilters({ ...filters, experience_level: e.target.value })
            }
          >
            <option value="">All Levels</option>
            <option value="junior">Junior (&lt;5 years)</option>
            <option value="mid">Mid (5-10 years)</option>
            <option value="senior">Senior (&gt;10 years)</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Specialization</label>
          <select
            value={filters.specialization}
            onChange={(e) =>
              setFilters({ ...filters, specialization: e.target.value })
            }
          >
            <option value="">All Specializations</option>
            {Object.entries(specializationLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading travel agents...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadAgents} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <FiSearch size={48} />
          <h3>No agents found</h3>
          <p>Try adjusting your filters to see more results</p>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-avatar">
                  {agent.profile_photo_url ? (
                    <img
                      src={agent.profile_photo_url}
                      alt={agent.name}
                    />
                  ) : (
                    <div className="agent-avatar-placeholder">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="agent-info">
                  <h3>
                    {agent.business_name || agent.name}
                    {agent.is_verified && (
                      <span className="verified-badge" title="Verified Agent">
                        <FiStar />
                      </span>
                    )}
                  </h3>
                  {agent.business_name && agent.owner_name && (
                    <p className="owner-name">{agent.owner_name}</p>
                  )}
                </div>
              </div>

              {agent.bio && (
                <p className="agent-bio">{agent.bio}</p>
              )}

              <div className="agent-details">
                {agent.country_of_operation && (
                  <div className="detail-item">
                    <FiMapPin />
                    <span>
                      {getCountryName(agent.country_of_operation)}
                      {agent.cities_covered &&
                        agent.cities_covered.length > 0 &&
                        ` • ${agent.cities_covered.join(", ")}`}
                    </span>
                  </div>
                )}

                {agent.years_of_experience !== null && (
                  <div className="detail-item">
                    <FiClock />
                    <span>{agent.years_of_experience} years experience</span>
                  </div>
                )}

                {agent.specializations && agent.specializations.length > 0 && (
                  <div className="detail-item">
                    <span className="specializations">
                      {agent.specializations
                        .map((s) => specializationLabels[s] || s)
                        .join(", ")}
                    </span>
                  </div>
                )}

                {agent.supported_destination_countries &&
                  agent.supported_destination_countries.length > 0 && (
                    <div className="detail-item">
                      <FiGlobe />
                      <span>
                        {agent.supported_destination_countries
                          .map((c) => getCountryName(c))
                          .slice(0, 3)
                          .join(", ")}
                        {agent.supported_destination_countries.length > 3 &&
                          ` +${agent.supported_destination_countries.length - 3} more`}
                      </span>
                    </div>
                  )}

                {agent.languages_spoken &&
                  agent.languages_spoken.length > 0 && (
                    <div className="detail-item">
                      <span className="languages">
                        Languages: {agent.languages_spoken.join(", ")}
                      </span>
                    </div>
                  )}
              </div>

              <div className="agent-card-footer">
                <div
                  className={`availability-badge ${
                    agent.availability_status === "available"
                      ? "available"
                      : "unavailable"
                  }`}
                >
                  {agent.availability_status === "available"
                    ? "Available"
                    : "Unavailable"}
                </div>
                <button
                  className="btn-message"
                  onClick={() => handleMessageAgent(agent.user_id)}
                  disabled={agent.availability_status !== "available"}
                >
                  <FiMessageCircle />
                  Message Agent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Agents;

