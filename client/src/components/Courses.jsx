import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

import { Search, Mic, Play, Pause, SkipBack, SkipForward, X, ChevronDown, ChevronUp, Code, Server, Database, Cloud, Globe, Terminal } from 'lucide-react';

const TechEducationPlatform = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('Frontend');

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY; // Replace with your API key for testing
  const searchInputRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Define tech domains with their icons and queries
  const sections = [
    { id: 'Frontend', icon: <Code size={18} />, query: 'free frontend development courses tutorials react angular vue' },
    { id: 'Backend', icon: <Server size={18} />, query: 'free backend development courses tutorials node express django flask' },
    { id: 'Database', icon: <Database size={18} />, query: 'free database courses tutorials SQL MongoDB PostgreSQL' },
    { id: 'DevOps', icon: <Cloud size={18} />, query: 'free devops courses tutorials docker kubernetes CI/CD' },
    { id: 'Mobile', icon: <Globe size={18} />, query: 'free mobile app development courses tutorials react native flutter' },
    { id: 'AI/ML', icon: <Terminal size={18} />, query: 'free machine learning AI courses tutorials python tensorflow pytorch' }
  ];

  useEffect(() => {
    // Load initial videos based on the default section
    loadSectionVideos(activeSection);

    // Set up keyboard listener for spacebar and enter key
    const handleKeyDown = (e) => {
      // Handle spacebar for voice search
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        toggleVoiceSearch();
      }

      // Handle Enter key for search
      if (e.code === 'Enter' && !isListening) {
        handleSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  const loadSectionVideos = async (sectionId) => {
    setLoading(true);
    setApiError('');
    const section = sections.find(s => s.id === sectionId);
    const query = section ? section.query : 'free tech courses tutorials';

    try {
      if (!API_KEY) {
        console.error('YouTube API key is not configured. Please set VITE_YOUTUBE_API_KEY in your environment.');
        setApiError('YouTube API key is not configured. Please set VITE_YOUTUBE_API_KEY in your environment.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${query}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      if (data.error) {
        console.error('YouTube API error:', data.error);
        setApiError(data.error.message || 'Failed to load courses from YouTube API.');
      } else if (data.items) {
        setVideos(data.items);
        setFilteredVideos(data.items);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setApiError('Network error while contacting YouTube. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    searchVideos();
  };

  const searchVideos = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setApiError('');
    try {
      if (!API_KEY) {
        console.error('YouTube API key is not configured. Please set VITE_YOUTUBE_API_KEY in your environment.');
        setApiError('YouTube API key is not configured. Please set VITE_YOUTUBE_API_KEY in your environment.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=24&q=${searchTerm} free tech course tutorial&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      if (data.error) {
        console.error('YouTube API error:', data.error);
        setApiError(data.error.message || 'Failed to load search results from YouTube API.');
      } else if (data.items) {
        setVideos(data.items);
        setFilteredVideos(data.items);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        // Automatically search with the recognized term when spacebar is pressed the second time
        searchVideos();
      }
    } else {
      startVoiceRecognition();
    }
  };

  const startVoiceRecognition = () => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.start();
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    loadSectionVideos(sectionId);
  };

  const playVideo = async (index) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    setPlayerExpanded(true);

    // Enroll/Update progress
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put(`${API_URL}/api/users/course-progress`, {
          courseId: filteredVideos[index].id.videoId,
          title: filteredVideos[index].snippet.title,
          progress: 1, // Started
          completed: false
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      console.error("Failed to track course", err);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = (e) => {
    if (videoPlayerRef.current) {
      setCurrentTime(videoPlayerRef.current.currentTime);
    }
  };

  const handleDurationChange = (e) => {
    if (videoPlayerRef.current) {
      setDuration(videoPlayerRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white bg-opacity-20">
              <Code size={18} />
            </div>
            <h1 className="text-2xl font-bold">10xCoders</h1>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-purple-100 p-4 shadow-md">
        <div className="container mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className={`relative flex-grow rounded-xl overflow-hidden ${isListening ? 'ring-2 ring-purple-500 pulse-animation' : ''}`}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for free tech courses or press spacebar to search by voice..."
                className="w-full p-3 pl-12 bg-white text-gray-800 focus:outline-none transition-colors duration-300 border border-purple-200"
                aria-label="Search input. Press spacebar to start voice search."
              />
              <Search className="absolute left-4 top-3.5 text-purple-500" size={20} />
              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white' : 'bg-purple-100 text-purple-700'} hover:opacity-80 transition`}
                  aria-label={isListening ? "Stop voice search and search" : "Start voice search"}
                >
                  <Mic size={18} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:opacity-90 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition"
              aria-label="Search button"
            >
              Search
            </button>
          </form>

          {apiError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {apiError}
            </div>
          )}

          {/* Tech Domains */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${activeSection === section.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                  : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                  }`}
                aria-label={`${section.id} section`}
                aria-pressed={activeSection === section.id}
              >
                {section.icon}
                {section.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Video Grid or Player */}
        <div className="flex-grow flex flex-col md:flex-row md:items-start h-full overflow-hidden">
          {/* Video Player Section */}
          {currentVideoIndex >= 0 && filteredVideos[currentVideoIndex] && playerExpanded && (
            <div className={`${showPlaylist ? 'md:w-2/3' : 'w-full'} flex flex-col transition-all duration-300 h-full overflow-y-auto`}>
              <div className="relative w-full pt-[56.25%] bg-black">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${filteredVideos[currentVideoIndex].id.videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0`}
                  title={filteredVideos[currentVideoIndex].snippet.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  aria-label={`Now playing: ${filteredVideos[currentVideoIndex].snippet.title}`}
                ></iframe>
              </div>

              <div className="bg-white text-gray-800 p-4 border-t border-purple-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold line-clamp-2">{filteredVideos[currentVideoIndex].snippet.title}</h2>
                    <p className="text-purple-600 mt-1">{filteredVideos[currentVideoIndex].snippet.channelTitle}</p>
                  </div>
                  <button
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="p-2 rounded-full hover:bg-purple-100 transition-colors ml-4"
                    aria-label={showPlaylist ? "Hide playlist" : "Show playlist"}
                  >
                    {showPlaylist ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>
                </div>

                {/* Video Controls */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-6">
                    <button onClick={playPrevious} className="p-2 rounded-full hover:bg-purple-100 transition" aria-label="Previous video">
                      <SkipBack size={24} className="text-purple-700" />
                    </button>

                    <button
                      onClick={togglePlayPause}
                      className="p-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full hover:opacity-90 transition shadow-lg transform hover:scale-105 active:scale-95"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white fill-current" />}
                    </button>

                    <button onClick={playNext} className="p-2 rounded-full hover:bg-purple-100 transition" aria-label="Next video">
                      <SkipForward size={24} className="text-purple-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Grid/List */}
          <div
            className={`${currentVideoIndex >= 0 && playerExpanded
              ? (showPlaylist ? 'w-full md:w-1/3 block' : 'hidden')
              : 'w-full'
              } bg-gray-50 transition-all duration-300 h-full overflow-y-auto`}
          >
            {loading ? (
              <div className="flex justify-center items-center h-40 mt-8">
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-500 border-r-purple-400 border-b-purple-300 border-l-purple-200 rounded-full animate-spin"></div>
                </div>
                <span className="sr-only">Loading courses...</span>
              </div>
            ) : (
              <div className="container mx-auto p-4">
                {currentVideoIndex >= 0 && playerExpanded && (
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-purple-800">Up Next</h2>
                    <button
                      onClick={() => setPlayerExpanded(false)}
                      className="p-1.5 rounded-full hover:bg-purple-100"
                      aria-label="Minimize player"
                    >
                      <X size={18} className="text-purple-700" />
                    </button>
                  </div>
                )}

                <div className={`grid grid-cols-1 ${currentVideoIndex >= 0 && playerExpanded
                  ? 'sm:grid-cols-1'
                  : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  } gap-4`}>
                  {filteredVideos.map((video, index) => (
                    <div
                      key={video.id.videoId}
                      className={`bg-white hover:bg-purple-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer group ${currentVideoIndex === index ? 'border-2 border-purple-500' : 'border border-purple-100'
                        }`}
                      onClick={() => playVideo(index)}
                      role="button"
                      aria-label={`Play course: ${video.snippet.title}`}
                      tabIndex="0"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          playVideo(index);
                        }
                      }}
                    >
                      <div className="relative">
                        <img
                          src={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium.url}
                          alt={video.snippet.title}
                          className="w-full aspect-video object-cover group-hover:opacity-90 transition"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 bg-opacity-80 rounded-full">
                            <Play size={24} className="text-white" />
                          </div>
                        </div>
                        {currentVideoIndex === index && isPlaying && (
                          <div className="absolute bottom-2 right-2 p-1.5 bg-purple-600 rounded-md">
                            <Pause size={16} className="text-white" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs rounded px-2 py-1">
                          FREE
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium line-clamp-2 text-sm">{video.snippet.title}</h3>
                        <p className="text-xs mt-1 text-purple-600">{video.snippet.channelTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voice Recognition Indicator */}
      {
        isListening && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-500 text-white py-2 px-4 rounded-full shadow-lg flex items-center gap-2 z-50">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Listening... Press spacebar again to search</span>
          </div>
        )
      }

      {/* Mini Player when video is selected but full player is minimized */}
      {
        currentVideoIndex >= 0 && !playerExpanded && filteredVideos[currentVideoIndex] && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex items-center p-2 z-40 border-t border-purple-100">
            <div className="flex items-center flex-grow gap-3">
              <img
                src={filteredVideos[currentVideoIndex].snippet.thumbnails.default.url}
                alt={filteredVideos[currentVideoIndex].snippet.title}
                className="w-14 h-12 object-cover rounded"
              />
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-sm line-clamp-1">{filteredVideos[currentVideoIndex].snippet.title}</h3>
                <p className="text-xs text-purple-600">{filteredVideos[currentVideoIndex].snippet.channelTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={playPrevious} className="p-1.5 rounded-full hover:bg-purple-100 transition" aria-label="Previous video">
                <SkipBack size={18} className="text-purple-700" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={playNext} className="p-1.5 rounded-full hover:bg-purple-100 transition" aria-label="Next video">
                <SkipForward size={18} className="text-purple-700" />
              </button>
              <button
                onClick={() => setPlayerExpanded(true)}
                className="p-1.5 rounded-full hover:bg-purple-100 transition ml-2"
                aria-label="Expand player"
              >
                <ChevronUp size={18} className="text-purple-700" />
              </button>
            </div>
          </div>
        )
      }

      <style>{`
        .pulse-animation {
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0);
          }
        }
        
        /* Custom scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3e8ff;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #a855f7;
          border-radius: 20px;
        }
      `}</style>
    </div >
  );
};

export default TechEducationPlatform;