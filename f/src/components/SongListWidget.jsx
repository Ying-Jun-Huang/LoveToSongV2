// file: love-to-song-frontend/src/components/SongListWidget.jsx
import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../services/authService';

const SongListWidget = () => {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    // Fetch song list from backend (for example, all available songs)
    async function fetchSongs() {
      const token = getAuthToken();
      const res = await fetch('http://localhost:3000/songs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    }
    fetchSongs();
  }, []);

  return (
    <div className="song-list-widget">
      <h3>Available Songs</h3>
      <ul>
        {songs.map(song => (
          <li key={song.id}>{song.title} by {song.artist}</li>
        ))}
      </ul>
    </div>
  );
};

export default SongListWidget;
