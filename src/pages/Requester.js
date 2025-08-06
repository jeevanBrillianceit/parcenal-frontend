import React, { useState } from 'react';
import { Country, State, City } from 'country-state-city';
import axiosInstance from '../utils/axiosInstance';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

const Requester = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    departureCountry: '',
    departureState: '',
    departureCity: '',
    departureLat: '',
    departureLon: '',
    arrivalCountry: '',
    arrivalState: '',
    arrivalCity: '',
    arrivalLat: '',
    arrivalLon: '',
    arrivalDate: '',
    description: ''
  });

  const countries = Country.getAllCountries();
  const depStates = formData.departureCountry ? State.getStatesOfCountry(formData.departureCountry) : [];
  const depCities = formData.departureState ? City.getCitiesOfState(formData.departureCountry, formData.departureState) : [];
  const arrStates = formData.arrivalCountry ? State.getStatesOfCountry(formData.arrivalCountry) : [];
  const arrCities = formData.arrivalState ? City.getCitiesOfState(formData.arrivalCountry, formData.arrivalState) : [];


const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
      // // Step 1: Get Amadeus token
      // const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({
      //     grant_type: 'client_credentials',
      //     client_id: 'xtOjQ4PZT813pbFwUCd9usBGkJdP3O1G', // replace with your Amadeus client_id
      //     client_secret: 'AyxPgOWoAtxucnwK' // replace with your Amadeus client_secret
      //   })
      // });

      // const tokenData = await tokenRes.json();
      // const token = tokenData.access_token;

      // // Step 2: Call Amadeus PNR API
      // const recordLocator = 'ABC123'; // Replace or get from user
      // const lastName = 'Singh'; // Replace or get from user

      // const pnrRes = await fetch(`https://test.api.amadeus.com/v1/trip-records?recordLocator=${recordLocator}&lastName=${lastName}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // const pnrData = await pnrRes.json();

      // if (pnrData?.data?.flightOffer) {
      //   const firstFlight = pnrData.data.flightOffer.itineraries[0].segments[0];
      //   const lastFlight = pnrData.data.flightOffer.itineraries[0].segments.slice(-1)[0];

      //   const departureAirport = firstFlight.departure.iataCode;
      //   const departureTime = firstFlight.departure.at;
      //   const arrivalAirport = lastFlight.arrival.iataCode;
      //   const arrivalTime = lastFlight.arrival.at;

      //   console.log('PNR Verified ', {
      //     departureAirport,
      //     departureTime,
      //     arrivalAirport,
      //     arrivalTime
      //   });
      // } else {
      //   alert('PNR not valid or not found in Amadeus sandbox');
      //   return;
      // }

      // Step 3: Save form data as usual
      const res = await axiosInstance.post('/user/requester-info', formData);
      if (res.data.status === 1) {
        alert('Request saved successfully');
        // navigate('/dashboard');
      } else {
        alert(res.data.response);
      }
    } catch (err) {
      alert(err.response?.data?.response || 'Error verifying PNR or saving request');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {loading && <Loader />}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Requester Details</h2>

        <label className="block mb-1">Departure Country</label>
        <select value={formData.departureCountry} onChange={e => setFormData({ ...formData, departureCountry: e.target.value, departureCity: '' })} className="w-full border mb-2 px-2 py-1">
          <option value="">Select Country</option>
          {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
        </select>

        <label className="block mb-1">Departure State</label>
        <select
          value={formData.departureState}
          onChange={e => setFormData({ ...formData, departureState: e.target.value, departureCity: '' })}
          className="w-full border mb-2 px-2 py-1"
        >
          <option value="">Select State</option>
          {depStates.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
        </select>

        <label className="block mb-1">Departure City</label>
        <select
          value={formData.departureCity}
          onChange={e => {
            const city = depCities.find(c => c.name === e.target.value);
            setFormData({
              ...formData,
              departureCity: city.name,
              departureLat: city.latitude,
              departureLon: city.longitude
            });
          }}
          className="w-full border mb-2 px-2 py-1"
        >
          <option value="">Select City</option>
          {depCities.map(c => <option key={`${c.name}-${c.latitude}-${c.longitude}`}  value={c.name}>{c.name}</option>)}
        </select>

        <label className="block mb-1">Arrival Country</label>
        <select value={formData.arrivalCountry} onChange={e => setFormData({ ...formData, arrivalCountry: e.target.value, arrivalCity: '' })} className="w-full border mb-2 px-2 py-1">
          <option value="">Select Country</option>
          {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
        </select>

        <label className="block mb-1">Arrival State</label>
        <select
          value={formData.arrivalState}
          onChange={e => setFormData({ ...formData, arrivalState: e.target.value, arrivalCity: '' })}
          className="w-full border mb-2 px-2 py-1"
        >
          <option value="">Select State</option>
          {arrStates.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
        </select>


        <label className="block mb-1">Arrival City</label>
        <select
          value={formData.arrivalCity}
          onChange={e => {
            const city = arrCities.find(c => c.name === e.target.value);
            setFormData({
              ...formData,
              arrivalCity: city.name,
              arrivalLat: city.latitude,
              arrivalLon: city.longitude
            });
          }}
          className="w-full border mb-2 px-2 py-1"
        >
          <option value="">Select City</option>
          {arrCities.map(c => <option key={`${c.name}-${c.latitude}-${c.longitude}`}  value={c.name}>{c.name}</option>)}
        </select>


        <label className="block mb-1">Expected Arrival Date</label>
        <input type="date" value={formData.arrivalDate} min={new Date().toISOString().split('T')[0]} onChange={e => setFormData({ ...formData, arrivalDate: e.target.value })} className="w-full border mb-2 px-2 py-1" />

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
        <p className="text-sm text-gray-500 mb-2">{formData.description.length}/150 characters</p>

        <button className="w-full bg-blue-600 text-white py-2 rounded">Submit</button>
      </form>
    </div>
  );
};

export default Requester;
