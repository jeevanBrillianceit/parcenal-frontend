// Traveler.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import airports from '../json/airports.json';
import { toast } from 'react-toastify';

const Traveler = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(':').slice(0, 2).join(':');

  const [formData, setFormData] = useState({
    departureAirport: null,
    arrivalAirport: null,
    departureDateTime: `${currentDate}T${currentTime}`,
    arrivalDateTime: `${currentDate}T${currentTime}`,
    flightNumber: '',
    pnr: '',
    description: ''
  });

  const [airportSearch, setAirportSearch] = useState({ departure: '', arrival: '' });
  const [filteredAirports, setFilteredAirports] = useState({ departure: [], arrival: [] });
  const [focusedDropdown, setFocusedDropdown] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState({ departure: -1, arrival: -1 });

  const departureDropdownRef = useRef(null);
  const arrivalDropdownRef = useRef(null);

  const airportList = useMemo(() => Object.values(airports), []);

  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const filterAirports = (input, type) => {
    const excludeCode = type === 'departure' ? formData.arrivalAirport?.icao : formData.departureAirport?.icao;

    return airportList
      .filter((a) => a.icao !== excludeCode)
      .filter((a) =>
        `${a.name} ${a.city} ${a.state} ${a.country}`
          .toLowerCase()
          .includes(input.toLowerCase())
      )
      .slice(0, 100);
  };

  const debouncedFilter = useMemo(() => ({
    departure: debounce((text) => {
      setFilteredAirports((prev) => ({
        ...prev,
        departure: filterAirports(text, 'departure')
      }));
    }, 300),
    arrival: debounce((text) => {
      setFilteredAirports((prev) => ({
        ...prev,
        arrival: filterAirports(text, 'arrival')
      }));
    }, 300)
  }), [formData.arrivalAirport, formData.departureAirport]);

  useEffect(() => {
    debouncedFilter.departure(airportSearch.departure);
  }, [airportSearch.departure, debouncedFilter]);

  useEffect(() => {
    debouncedFilter.arrival(airportSearch.arrival);
  }, [airportSearch.arrival, debouncedFilter]);

  const handleAirportSelect = (type, airport) => {
    const opposite = type === 'departure' ? 'arrival' : 'departure';
    if (formData[opposite]?.icao === airport.icao) {
      alert('Same airport cannot be selected for both Departure and Arrival');
      return;
    }

    const display = `${airport.name} (${airport.city}, ${airport.state}, ${airport.country})`;
    setFormData({ ...formData, [`${type}Airport`]: airport });
    setAirportSearch({ ...airportSearch, [type]: display });
    setFocusedDropdown('');
    setHighlightedIndex({ ...highlightedIndex, [type]: -1 });
  };

  const handleKeyDown = (e, type) => {
    const list = filteredAirports[type];
    if (e.key === 'ArrowDown') {
      setHighlightedIndex(prev => ({
        ...prev,
        [type]: Math.min((prev[type] || 0) + 1, list.length - 1)
      }));
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(prev => ({
        ...prev,
        [type]: Math.max((prev[type] || 0) - 1, 0)
      }));
    } else if (e.key === 'Enter') {
      const index = highlightedIndex[type];
      if (index >= 0 && index < list.length) {
        const a = list[index];
        handleAirportSelect(type, a);
        e.preventDefault();
      }
    }
  };

  const highlightMatch = (text, search) => {
    const regex = new RegExp(`(${search})`, 'gi');
    return <span dangerouslySetInnerHTML={{ __html: text.replace(regex, '<mark>$1</mark>') }} />;
  };

  const handleOutsideClick = (e) => {
    if (
      departureDropdownRef.current &&
      !departureDropdownRef.current.contains(e.target) &&
      arrivalDropdownRef.current &&
      !arrivalDropdownRef.current.contains(e.target)
    ) {
      setFocusedDropdown('');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { departureAirport, arrivalAirport, departureDateTime, arrivalDateTime, flightNumber, pnr } = formData;

    if (!departureAirport || !arrivalAirport) {
      toast.error('Both departure and arrival airports must be selected');
      return;
    }

    const payload = {
      departureAirport,
      arrivalAirport,
      departureDateTime,
      arrivalDateTime,
      flightNumber,
      pnr,
      description: formData.description || null
    };

    setLoading(true);
    try {
      const token = localStorage.getItem('user');

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/user/traveler-info`, payload, {
        headers: { Authorization: `Bearer ${JSON.parse(token).token}` }
      });

      if (res.data.status === 1) {
        toast.success('Traveler info saved');
        // navigate('/dashboard');
      } else {
        toast.error(res.data.response);
      }
    } catch (err) {
      toast.error(err.response?.data?.response || 'Error saving info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {loading && <Loader />}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-lg relative z-10">
        <h2 className="text-2xl mb-4 font-bold">Traveler Details</h2>

        {/* Departure Airport */}
        <label className="block mb-1">Departure Airport</label>
        <div className="relative mb-2" ref={departureDropdownRef}>
          <input
            value={airportSearch.departure}
            onChange={(e) => {
              setAirportSearch({ ...airportSearch, departure: e.target.value });
              setFocusedDropdown('departure');
              setHighlightedIndex({ ...highlightedIndex, departure: -1 });
            }}
            placeholder="Search Departure Airport"
            className="w-full border px-2 py-1"
            onFocus={() => setFocusedDropdown('departure')}
            onKeyDown={(e) => handleKeyDown(e, 'departure')}
          />
          {focusedDropdown === 'departure' && (
            <ul className="absolute z-10 bg-white border w-full max-h-52 overflow-y-auto">
              {filteredAirports.departure.map((a, index) => {
                const display = `${a.name} (${a.city}, ${a.state}, ${a.country})`;
                return (
                  <li
                    key={a.icao}
                    className={`px-2 py-1 cursor-pointer hover:bg-gray-200 ${index === highlightedIndex.departure ? 'bg-blue-100' : ''}`}
                    onClick={() => handleAirportSelect('departure', a)}
                  >
                    {highlightMatch(display, airportSearch.departure)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Arrival Airport */}
        <label className="block mb-1">Arrival Airport</label>
        <div className="relative mb-2" ref={arrivalDropdownRef}>
          <input
            value={airportSearch.arrival}
            onChange={(e) => {
              setAirportSearch({ ...airportSearch, arrival: e.target.value });
              setFocusedDropdown('arrival');
              setHighlightedIndex({ ...highlightedIndex, arrival: -1 });
            }}
            placeholder="Search Arrival Airport"
            className="w-full border px-2 py-1"
            onFocus={() => setFocusedDropdown('arrival')}
            onKeyDown={(e) => handleKeyDown(e, 'arrival')}
          />
          {focusedDropdown === 'arrival' && (
            <ul className="absolute z-10 bg-white border w-full max-h-52 overflow-y-auto">
              {filteredAirports.arrival.map((a, index) => {
                const display = `${a.name} (${a.city}, ${a.state}, ${a.country})`;
                return (
                  <li
                    key={a.icao}
                    className={`px-2 py-1 cursor-pointer hover:bg-gray-200 ${index === highlightedIndex.arrival ? 'bg-blue-100' : ''}`}
                    onClick={() => handleAirportSelect('arrival', a)}
                  >
                    {highlightMatch(display, airportSearch.arrival)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Departure DateTime */}
        <label className="block mb-1">
          Departure Date & Time
          {formData.departureAirport?.tz && (
            <span className="text-sm text-gray-500 ml-2">({formData.departureAirport.tz})</span>
          )}
        </label>
        <input
          type="datetime-local"
          className="w-full border px-2 py-1 mb-2"
          value={formData.departureDateTime}
          min={`${currentDate}T${currentTime}`}
          onChange={(e) => setFormData({ ...formData, departureDateTime: e.target.value })}
        />

        {/* Arrival DateTime */}
        <label className="block mb-1">
          Arrival Date & Time
          {formData.arrivalAirport?.tz && (
            <span className="text-sm text-gray-500 ml-2">({formData.arrivalAirport.tz})</span>
          )}
        </label>
        <input
          type="datetime-local"
          className="w-full border px-2 py-1 mb-2"
          value={formData.arrivalDateTime}
          min={`${currentDate}T${currentTime}`}
          onChange={(e) => setFormData({ ...formData, arrivalDateTime: e.target.value })}
        />

        {/* Flight Number */}
        <label className="block mb-1">Flight Number</label>
        <input
          placeholder="Flight Number"
          className="w-full border px-2 py-1 mb-2"
          value={formData.flightNumber}
          onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
        />

        {/* PNR */}
        <label className="block mb-1">PNR (optional)</label>
        <input
          placeholder="PNR (optional)"
          className="w-full border px-2 py-1 mb-4"
          value={formData.pnr}
          onChange={(e) => setFormData({ ...formData, pnr: e.target.value })}
        />

        <label className="block mb-1">Description (max 150 characters)</label>
        <textarea
          value={formData.description}
          onChange={e => {
            if (e.target.value.length <= 150) {
              setFormData({ ...formData, description: e.target.value });
            }
          }}
          maxLength={150}
          className="w-full border mb-2 px-2 py-1"
          rows={3}
        />
        <p className="text-sm text-gray-500 mb-4">{formData.description.length}/150 characters</p>

        <button className="w-full bg-blue-600 text-white py-2 rounded">Save</button>
      </form>
    </div>
  );
};

export default Traveler;
