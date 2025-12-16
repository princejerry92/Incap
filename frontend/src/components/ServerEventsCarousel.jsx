import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, AlertTriangle, Megaphone, Image as ImageIcon } from 'lucide-react';

const ServerEventsCarousel = ({ events = [], onEventUpdate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const intervalRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Auto-play functionality
    useEffect(() => {
        if (isAutoPlaying && events.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) =>
                    prevIndex === events.length - 1 ? 0 : prevIndex + 1
                );
            }, 5000); // Change slide every 5 seconds
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isAutoPlaying, events.length]);

    // Stop auto-play on user interaction
    const handleUserInteraction = () => {
        setIsAutoPlaying(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    // Navigation functions
    const goToPrevious = () => {
        handleUserInteraction();
        setCurrentIndex(currentIndex === 0 ? events.length - 1 : currentIndex - 1);
    };

    const goToNext = () => {
        handleUserInteraction();
        setCurrentIndex(currentIndex === events.length - 1 ? 0 : currentIndex + 1);
    };

    const goToSlide = (index) => {
        handleUserInteraction();
        setCurrentIndex(index);
    };

    // Touch handlers for swipe
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        handleSwipe();
    };

    const handleSwipe = () => {
        const swipeThreshold = 50; // Minimum distance for swipe
        const swipeDistance = touchStartX.current - touchEndX.current;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swiped left - next slide
                goToNext();
            } else {
                // Swiped right - previous slide
                goToPrevious();
            }
        }
    };

    // Get event type icon and color
    const getEventTypeDisplay = (eventType) => {
        switch (eventType) {
            case 'notification':
                return {
                    icon: AlertTriangle,
                    color: 'text-red-500',
                    bgColor: 'bg-red-50'
                };
            case 'picture':
                return {
                    icon: ImageIcon,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50'
                };
            case 'text':
            default:
                return {
                    icon: Megaphone,
                    color: 'text-green-500',
                    bgColor: 'bg-green-50'
                };
        }
    };

    // Empty state
    if (!events || events.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Events Available</h3>
                <p className="text-gray-500 text-sm">Check back later for updates and announcements.</p>
            </div>
        );
    }

    const currentEvent = events[currentIndex];
    const eventDisplay = getEventTypeDisplay(currentEvent.event_type);

    return (
        <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-green-600" />
                    Announcements
                </h3>
                {events.length > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToPrevious}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Previous event"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="flex gap-1">
                            {events.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    aria-label={`Go to event ${index + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={goToNext}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Next event"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                )}
            </div>

            <div
                className="relative overflow-hidden cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Event Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-all transform hover:scale-[1.02]">
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${eventDisplay.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <eventDisplay.icon className={`w-5 h-5 ${eventDisplay.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                {currentEvent.title}
                            </h4>

                            {currentEvent.content && (
                                <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                                    {currentEvent.content}
                                </p>
                            )}

                            {currentEvent.image_url && (
                                <div className="mt-3">
                                    <img
                                        src={currentEvent.image_url}
                                        alt={currentEvent.title}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                            <div className="mt-3 text-xs text-gray-500">
                                {new Date(currentEvent.updated_at || currentEvent.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress indicator for auto-play */}
                {isAutoPlaying && events.length > 1 && (
                    <div className="mt-3 bg-gray-200 rounded-full h-1 overflow-hidden">
                        <div
                            className="bg-green-500 h-1 rounded-full transition-all duration-100 ease-linear"
                            style={{
                                width: '0%',
                                animation: 'progress 5s linear infinite'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Add progress animation CSS */}
            <style jsx>{`
        @keyframes progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default ServerEventsCarousel;
