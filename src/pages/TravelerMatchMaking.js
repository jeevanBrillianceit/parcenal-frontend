import React, { useEffect, useMemo, useRef, useState } from 'react';
import airports from '../json/airports.json';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDateTime } from '../utils/dateFormatter';
import { isTokenValid, getCurrentUser } from '../utils/auth.helper';

const TravelerMatchMaking = () => {
  const [search, setSearch] = useState({ departure: '', arrival: '' });
  const [filteredAirports, setFilteredAirports] = useState({ departure: [], arrival: [] });
  const [selectedAirport, setSelectedAirport] = useState({ departure: null, arrival: null });
  const [highlightedIndex, setHighlightedIndex] = useState({ departure: -1, arrival: -1 });
  const [focusedDropdown, setFocusedDropdown] = useState('');
  const [radius, setRadius] = useState('100');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const airportList = useMemo(() => Object.values(airports), []);
  const dropdownRefs = {
    departure: useRef(null),
    arrival: useRef(null)
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.type_id === 1) {
      toast.error('Travelers cannot access Traveler Matchmaking page.');
      navigate('/profile');
    }

    // Restore search if coming from login flow
    if (location.state?.searchData) {
      const { departureAirport, arrivalAirport, radius, selectedDate } = location.state.searchData;
      setSelectedAirport({ departure: departureAirport, arrival: arrivalAirport });
      setSearch({
        departure: `${departureAirport.name} (${departureAirport.city}, ${departureAirport.state}, ${departureAirport.country})`,
        arrival: `${arrivalAirport.name} (${arrivalAirport.city}, ${arrivalAirport.state}, ${arrivalAirport.country})`
      });
      setRadius(radius);
      setSelectedDate(selectedDate);
      setTimeout(() => handleSearch(), 200); // Small delay to ensure state is set
    }
  }, [location.state]);

  useEffect(() => {
    const stateData = location.state?.searchData;
    if (stateData) {
      setSelectedAirport({ departure: stateData.departure, arrival: stateData.arrival });
      setSearch({
        departure: `${stateData.departure.name} (${stateData.departure.city}, ${stateData.departure.state}, ${stateData.departure.country})`,
        arrival: `${stateData.arrival.name} (${stateData.arrival.city}, ${stateData.arrival.state}, ${stateData.arrival.country})`
      });
      setRadius(stateData.radius);
      setSelectedDate(stateData.selectedDate);
      setTimeout(() => handleSearch(), 200); // Small delay to ensure state is set
    }
  }, [location.state]);

  const toggleDescription = (index) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  const filterAirports = debounce((text, type) => {
    const filtered = airportList
      .filter((a) => `${a.name} ${a.city} ${a.state} ${a.country}`.toLowerCase().includes(text.toLowerCase()))
      .slice(0, 100);
    setFilteredAirports(prev => ({ ...prev, [type]: filtered }));
  }, 300);

  useEffect(() => {
    if (search.departure) filterAirports(search.departure, 'departure');
    else setFilteredAirports(prev => ({ ...prev, departure: [] }));
  }, [search.departure]);

  useEffect(() => {
    if (search.arrival) filterAirports(search.arrival, 'arrival');
    else setFilteredAirports(prev => ({ ...prev, arrival: [] }));
  }, [search.arrival]);

  const handleAirportSelect = (type, airport) => {
    const label = `${airport.name} (${airport.city}, ${airport.state}, ${airport.country})`;
    setSelectedAirport(prev => ({ ...prev, [type]: airport }));
    setSearch(prev => ({ ...prev, [type]: label }));
    setFocusedDropdown('');
    setHighlightedIndex(prev => ({ ...prev, [type]: -1 }));
  };

  const handleKeyDown = (e, type) => {
    const list = filteredAirports[type];
    if (e.key === 'ArrowDown') {
      setHighlightedIndex(prev => ({ ...prev, [type]: Math.min(prev[type] + 1, list.length - 1) }));
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(prev => ({ ...prev, [type]: Math.max(prev[type] - 1, 0) }));
    } else if (e.key === 'Enter') {
      const i = highlightedIndex[type];
      if (i >= 0 && i < list.length) {
        handleAirportSelect(type, list[i]);
        e.preventDefault();
      }
    }
  };

  const handleOutsideClick = (e) => {
    if (!dropdownRefs.departure.current?.contains(e.target) && 
        !dropdownRefs.arrival.current?.contains(e.target)) {
      setFocusedDropdown('');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearch = async () => {
    if (!selectedAirport.arrival) return toast.error('Please select an arrival airport');
    if (!selectedAirport.departure) return toast.error('Please select a departure airport');

    const payload = {
      departureAirport: selectedAirport.departure,
      arrivalAirport: selectedAirport.arrival,
      radius,
      selectedDate
    };

    try {
      setLoading(true);
      const res = await axiosInstance.post('/user/match-travelers', payload);
      if (res.data.status === 1) {
        const list = Array.isArray(res.data.data) ? res.data.data.map(item => ({
          ...item,
          rating: parseFloat(item.rating) || 0,
          departure_distance_km: parseFloat(item.departure_distance_km) || 0,
          arrival_distance_km: parseFloat(item.arrival_distance_km) || 0
        })) : [];

        const sorted = list.sort((a, b) => {
          const ratingDiff = b.rating - a.rating;
          if (ratingDiff !== 0) return ratingDiff;

          const aDistance = a.departure_distance_km + a.arrival_distance_km;
          const bDistance = b.departure_distance_km + b.arrival_distance_km;
          return aDistance - bDistance;
        });

        setResults(sorted);
      } else {
        setResults([]);
        toast.error(res.data.response || 'No matches found');
      }
    } catch (err) {
      setResults([]);
      toast.error(err.response?.data?.response || 'API Error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (receiverId, index, contextType, contextId) => {
    if (!isTokenValid()) {
      localStorage.setItem('pendingSearch', JSON.stringify({
        from: '/traveler-match',
        searchData: {
          departure: selectedAirport.departure,
          arrival: selectedAirport.arrival,
          radius,
          selectedDate
        }
      }));

      navigate('/login');
      return;
    }

    try {
      setResults(prev => prev.map((item, i) => 
        i === index ? { ...item, isSending: true } : item
      ));

      const res = await axiosInstance.post('/user/send-request', {
        receiver_id: receiverId,
        context_type: contextType,
        context_id: contextId
      });

      if (res.data.status === 1) {
        toast.success(res.data.response || 'Connection request sent successfully');
        setResults(prev => prev.map((item, i) => 
          i === index ? { ...item, request_status: 'Pending', isSending: false } : item
        ));
      } else {
        toast.error(res.data.response || 'Failed to send connection request');
        setResults(prev => prev.map((item, i) => 
          i === index ? { ...item, isSending: false } : item
        ));
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'API Error');
      setResults(prev => prev.map((item, i) => 
        i === index ? { ...item, isSending: false } : item
      ));
    }
  };

  const renderDropdown = (type) => (
    focusedDropdown === type && (
      <ul className="absolute z-10 bg-white border w-full max-h-52 overflow-y-auto">
        {filteredAirports[type].map((a, i) => {
          const label = `${a.name} (${a.city}, ${a.state}, ${a.country})`;
          return (
            <li
              key={a.icao + i}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-200 ${
                highlightedIndex[type] === i ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleAirportSelect(type, a)}
            >
              {label}
            </li>
          );
        })}
      </ul>
    )
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <div className="bg-white shadow-md rounded p-6 w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Traveler Matchmaking</h2>

        <label className="block font-bold mb-1">Departure Airport</label>
        <div className="relative mb-4" ref={dropdownRefs.departure}>
          <input
            value={search.departure}
            onChange={(e) => {
              setSearch(prev => ({ ...prev, departure: e.target.value }));
              setFocusedDropdown('departure');
            }}
            onFocus={() => setFocusedDropdown('departure')}
            onKeyDown={(e) => handleKeyDown(e, 'departure')}
            placeholder="Search Departure Airport"
            className="w-full border px-3 py-2 rounded"
          />
          {renderDropdown('departure')}
        </div>

        <label className="block font-bold mb-1">Arrival Airport</label>
        <div className="relative mb-4" ref={dropdownRefs.arrival}>
          <input
            value={search.arrival}
            onChange={(e) => {
              setSearch(prev => ({ ...prev, arrival: e.target.value }));
              setFocusedDropdown('arrival');
            }}
            onFocus={() => setFocusedDropdown('arrival')}
            onKeyDown={(e) => handleKeyDown(e, 'arrival')}
            placeholder="Search Arrival Airport"
            className="w-full border px-3 py-2 rounded"
          />
          {renderDropdown('arrival')}
        </div>

        <label className="block font-bold mb-1">Radius (in KM)</label>
        <select
          className="w-full border px-3 py-2 rounded mb-4"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        >
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
        </select>

        <label className="block font-bold mb-1">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full border px-3 py-2 rounded mb-6"
          min={new Date().toISOString().split('T')[0]}
        />

        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      <div className="w-full max-w-4xl">
        {loading && <p className="text-center">Loading...</p>}
        {Array.isArray(results) && results.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {results.map((item, index) => (
              <div key={index} className="bg-white shadow rounded p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.profile_image || '/default-avatar.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-sm text-yellow-500">
                      ⭐ {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'N/A'} / 5
                    </p>
                    <p className="text-sm text-gray-500">
                      Flight: {item.flight_number || 'N/A'} <br />
                      PNR: {item.pnr || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Departure: {item.departure_city}, {item.departure_state}, {item.departure_country}</p>
                  <p>Arrival: {item.arrival_city}, {item.arrival_state}, {item.arrival_country}</p>
                  <p>Departure Date: {formatDateTime(item.departure_date)}</p>
                  <p>Arrival Date: {formatDateTime(item.arrival_date)}</p>
                  <p className="mt-2">
                    {expandedDescriptions[index] || item.description?.length <= 100
                      ? item.description
                      : `${item.description?.substring(0, 100)}...`}
                    {item.description?.length > 100 && (
                      <button
                        onClick={() => toggleDescription(index)}
                        className="text-blue-500 ml-1"
                      >
                        {expandedDescriptions[index] ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleSendRequest(
                      item.user_id,
                      index,
                      item.context_type,
                      item.context_id
                    )
                  }
                  disabled={item.request_status || item.isSending}
                  className={`mt-2 w-full text-white px-4 py-1 rounded ${
                    item.request_status
                      ? 'bg-gray-400 cursor-not-allowed'
                      : item.isSending
                      ? 'bg-yellow-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {item.request_status
                    ? `Request ${item.request_status}`
                    : item.isSending
                    ? 'Sending...'
                    : 'Send Request'}
                </button>
              </div>
            ))}
          </div>
        )}
        {!loading && results.length === 0 && (
          <p className="text-center text-gray-500">No matches found</p>
        )}
      </div>
    </div>
  );
};

export default TravelerMatchMaking;